/**
 * @desc: Bigpipe
 * @authors: Yex
 * @date: 2016-08-03 20:32:03
 *
 */

'use strict';

var _ = require('lodash');
var EventEmitter = require('events').EventEmitter;
var Pagelet = require('./Pagelet');
var qmonitor = require('@qnpm/q-monitor');
var logger = require('@qnpm/q-logger');
var Promise = require('bluebird');
var Store = require('./Store');
var ErrorPagelet = require('./errorPagelet');
var util = require('./util');
var htmlParser = require('./htmlParser');

// 国内的一些搜索引擎，因为谷歌和必应对异步的网址做了优化，所以忽略
var spiderReg = /Baiduspider|HaoSouSpider|360spider|(Sogou\s*(web|inst)?\s*Spider)/i
var CONFIG = {};

function BigPipe(name, options) {

    this.bigpipe = this;

    // 标识符id，需要唯一
    this.name = name;

    this.options = options;

    // pagelet cache data
    this.store = new Store(options.storeID || 'store');

    // first-class pagelet module list
    this.pagelets = options.pagelets || [];

    // layout bootstrap
    this.layout = options.layout || options.bootstrap || {};

    // 错误 module
    this.errorPagelet = options.errorPagelet || CONFIG.errorPagelet || ErrorPagelet;

    // monitor key
    this.monitor = options.qmonitor || options.monitor || name;

    // 实例化的一级 first-class pagelets
    this._pagelets = [];

    // 实例化的layout页面
    this._layout = null;

    // 实例化的页面片段集合
    this._pageletList = [];

    // pagelet 缓存
    this._pageletMap = {};

    // errorpagelet 实例
    this._errorPagelet = null;

    // 需要flush到客户端的片段集合
    this._queue = [];

    // http something
    this._req = null;
    this._res = null;
    this._next = null;

    // 所有的一级 pagelet 数量
    this.length = 1; //Object.keys(options.pagelets).length || 1;

    this.initialize.call(this, options);

    // emitter
    this.setMaxListeners(100);
}

BigPipe.prototype = {
    constructor: BigPipe,

    // buffer encoding charset
    charset: 'utf-8',

    initialize: function(options) {
        if(!options) return this;

        var initProps = options.init || {};

        var bigpipe = this;
        _.forIn(initProps, function(value, key) {
            if(!bigpipe.hasOwnProperty(key)) {
                bigpipe[key] = value;
                // console.log('add props', key);
            } else {
                console.warn('新增实例方法[' + key + ']与Bigpipe原实例方法冲突');
            }
        });
        return this;
    },

    /**
     * 覆盖bigpipe的pagelet模块
     * @param  {Array} pageletsArray 模块map
     * @return {this}
     */
    usePagelets: function (pageletsArray) {
        if(_.isPlainObject(pageletsArray)) {
            var temp = [];
            _.forEach(pageletsArray, function(value, key) {
                temp.push(value);
            });
            pageletsArray = temp;
        }

        this.pagelets = pageletsArray;
        return this;
    },

    // same with usePagelets
    pipe: function(pageletsArray) {
        return this.usePagelets.call(this, pageletsArray);
    },

    /**
     * route 请求，每次处理新请求，需要更新bigpipe和对于模块的req,res,next
     * @return {this}
     */
    router: function(req, res, next) {
        logger.info('开始Bigpip, start router使用模块为['+ getPageletsName(this.pagelets) +']');
        qmonitor.addCount(this.monitor + '_page_visit');
        this.clear();

        this.bootstrap(req, res, next);
        this.createPagelets();
        this.start();

        return this;
    },

    clear: function() {
        this.store.clear();
        this._pageletMap = {};
        this._pageletList = [];
        this._pagelets = [];
        this._queue = [];
    },

    start: function() {
        var bigpipe = this;

        bigpipe._pageletList.forEach(function(pagelet, i) {
            bigpipe.analyze(pagelet, function () {
                pagelet.ready('ready');
            });
        });

        bigpipe._layout.ready('done');
        bigpipe._errorPagelet.ready('done');

        this.once('page:error', function(err) {
            logger.info('出现错误, 需要终止页面渲染', err, '\n');
            bigpipe.renderError(err);
        });
    },

    /**
     * [function description]
     * @param  {Object}   需要处理的の pagelet 实例
     * @param  {Function} done    处理好依赖之后的回调
     * @return {Object}           Promise
     */
    analyze: function(pagelet, done) {

        var bigpipe = this;
        var waitMods = pagelet.wait || [];

        var waitModNames = waitMods.map(function(mod) {
            if(typeof mod === 'string') {
                return mod;
            }
            return mod.prototype.name;
        });

        logger.info('start analyze module', pagelet.name, '依赖模块['+ waitModNames.join("|") +']');

        Promise.map(waitModNames, function(modName) {
            return bigpipe.waitFor(modName);
        }).then(function() {
            logger.info('analyze module done', pagelet.name);
            done.call(pagelet, pagelet);
        });
    },

    /**
     * 等待依赖模块ready
     * @param  {string} modName 模块名字
     * @return {Object}         Promise
     */
    waitFor: function(modName) {
        var bigpipe = this;
        // 首先需要触发pagelet的start
        bigpipe._pageletMap[modName].get();

        return new Promise(function(resolve, reject) {
            // pagelet load and parse data ready
            bigpipe.once(modName + ':done', function(data) {
                bigpipe.store.set(modName, data);
                resolve({
                    name: modName,
                    data: data
                });
            });

            // pagelet处理数据失败
            bigpipe.once(modName + ':fail', function(data) {
                bigpipe.store.set(modName, data);
                reject({
                    name: modName,
                    data: data
                });
            });
        });
    },

    /**
     * 将 render 之后的 pagelet push 到队列中
     * @param  {string} name  pagelet name
     * @param  {Object} chunk pagelet chunk
     * @return {this}       this
     */
    queue: function(name, chunk) {
        this.length--;

        this._queue.push({
            name: name,
            view: chunk
        });

        return this;
    },

    /**
     * 清空队列
     */
    clearQueue: function () {
        this._queue = [];
    },

    /**
     * flush chunk
     * @param  {Function} done flush 完成之后的callback
     * @return {[type]}        [description]
     */
    flush: function(done) {
        if(typeof  done !== 'function') {
            done = NOOP;
        }

        this.once('done', done);

        // end 的时候也触发了次flush,避免再次response到客户端
        if (!this._queue.length) {
            this.emit('done');
            return;
        }

        // 确保不会在 end 之后再 write chunk
        if(this._res.finished) {
            logger.error('Response was closed, unable to flush content');
            this.emit('end', new Error('Response was closed, unable to flush content'));
            return;
        }

        var data = new Buffer(this.join(), this.charset);
        var pageletName = this._queue.map(function (q) {
            return q.name;
        }).join('&');

        if(data.length) {
            logger.record('info: flush pagelet ['+ pageletName +'] data {{', /*data.toString(),*/'暂不记录}}');
            this._res.write(
                data,
                true
            );
        }

        // response.write(chunk[, encoding][, callback])
        // 如果write时候没有传回调，可以手动调用
        if(this._res.write.length !== 3 || !data.length) {
            this.emit('done');
        }

        // 所有pagelet都已经从队列中输出
        if(!this.length) {
            this.emit('end');
        }

        this.clearQueue();
    },

    /**
     * 合并chunk
     * @return {String} 合并后的chunk
     */
    join: function() {
        var result = this._queue.map(function(item) {
            // return item.data;
            return item.view;
        });

        return result.join('');
    },

    /**
     * 实例化 pagelets
     * @param  {} pagelets [description]
     * @return {[type]}          [description]
     */
    createPagelets: function() {
        var bigpipe = this;
        var _pageletList = this._pageletList;
        var _pageletMap = this._pageletMap;
        var _pagelets = this._pagelets;
        var allPagelets = this._getAllPagelets();
        var options = {
            req: bigpipe._req,
            res: bigpipe._res,
            next: bigpipe._next,
            query: bigpipe._query,
            layout: bigpipe._layout,
            bigpipe: bigpipe
        };

        // create error pagelet
        this._errorPagelet = this.errorPagelet.create('error', options);

        _.forIn(allPagelets, function(pagelet, name) {
            var newPagelet = pagelet.create(name, options);
            _pageletMap[name] = newPagelet;
            _pageletList.push(newPagelet);
        });

        // first-class pagelets
        this.pagelets.forEach(function(pg) {
            _pagelets.push( _pageletMap[pg.prototype.name] );
        });

        //refresh length + layout
        bigpipe.length = bigpipe.pagelets.length;

        return _pageletList;

    },

    /**
     * 获取pagelet and name
     * pagelet的名字如果没有指定的话则使用声明时候的name，如果在使用的时候有指定则覆盖
     * @return {Object} {pageletName: pageletClass}
     */
    _getAllPagelets: function() {

        var pagelets = this.pagelets;

        var allPageletObj = {};

        // TODO 为了兼容之前（1.0.x）的API，需要后期统一成数组
        if(_.isPlainObject(this.pagelets)) {
               var temp = [];
               _.forIn(this.pagelets, function(pagelet){
                   temp.push(pagelet);
               });
               this.pagelets = pagelets = temp;
        }

        this.pagelets.forEach(function(pagelet) {
            getDepends(pagelet);
        });

        return allPageletObj;

        // 递归获取所有用到的pagelets
        function getDepends(pagelet) {
            if(!pagelet) {
                return;
            }

            var pgClass = pagelet.prototype;
            // 已经解析过
            if(allPageletObj[pgClass.name]) {
                // logger.info('捉到重名的pagelet一只，请注意::', pgClass.name);
                return;
            }

            allPageletObj[pgClass.name] = pagelet;

            if(pgClass.wait.length) {
                pgClass.wait.forEach(function(pageletItem){
                    getDepends(pageletItem);
                });
            }
        }
    },

    /**
     * render layout
     * @param  {[type]}   req  [description]
     * @param  {[type]}   res  [description]
     * @param  {Function} next [description]
     * @return {[type]}        [description]
     */
    bootstrap: function(req, res, next) {
        this._req = req;
        this._res = res;
        this._next = next;

        this._layout = this.layout.create('layout', {
            req: this._req,
            res: this._res,
            next: this._next,
            bigpipe: this
        });

        // 客户端是否是蜘蛛抓取
        this.isSpider = spiderReg.test(req.headers['user-agent']);

        return this;

    },

    /**
     * 渲染layout页面
     * @return {Promise}
     */
    renderLayout: function() {
        var bigpipe = this;
        bigpipe._layout.ready('ready');
        bigpipe.length++;
        logger.info('开始渲染layout脚手架模块');

        return this._layout.render().then(function(chunk) {
                logger.info('渲染layout脚手架模块完成');
                return bigpipe._layout.write(chunk).flush();
            });
    },

    /**
     * 异步渲染pagelets, flush chunk to client as soon as possible without order
     * @return {Object} Promise
     */
    renderAsync: function() {
        if(this.isSpider && BigPipe.optimizeForSeo) {
            return this.renderSync.apply(this, arguments);
        }

        var bigpipe = this;
        var layout = this._layout;

        this.renderLayout().then(function() {
            return Promise.map(bigpipe._pagelets, function(pagelet) {
                // render Promise
                return pagelet.render().then(function (chunk) {
                    pagelet.write(chunk).flush();
                    return chunk;
                }, function (errData) {
                    logger.error('render Async failed', errData);
                    throw errData;
                })
                .catch(function(error) {
                    logger.error( 'render Async error', error);
                    throw error;
                });

            }).then(function(data) {
                layout.end();
            }).catch(function(err) {
                return bigpipe.catch(err);
            });

        }).catch(function(err) {
            qmonitor.addCount(bigpipe.monitor + '_rendlayout_error');
            bigpipe.catch(err);
        });
    },

    render: function() {
        if(this.isSpider && BigPipe.optimizeForSeo) {
            return this.renderSync.apply(this, arguments);
        }
        return this.renderAsync.apply(this, arguments);
    },

    /**
     * 同步渲染 pagelet 模块
     * @return {[type]} [description]
     */
    renderSync: function() {
        var bigpipe = this;
        var staticHtml = this.staticHtml = htmlParser(this.length);

        bigpipe._layout.getRenderHtml()
            .then(function(html) {
                staticHtml.setLayout(html);

                return Promise.map(bigpipe._pagelets, function(pagelet) {
                    // render Promise
                    return pagelet.getRenderChunk().then(function (chunk) {
                        staticHtml.setPagelet(chunk.domID, chunk);
                        return chunk.html;

                    }, function (errData) {
                        logger.error('render sync failed', errData);
                        throw errData;
                    })
                    .catch(function(error) {
                        logger.error( 'render sync error', error);
                        throw error;
                    });

                }).then(function(data) {
                    bigpipe._layout.end(staticHtml.getHtml(), true);
                }).catch(function(err) {
                    return bigpipe.catch(err);
                });
            })
            .catch(function(err) {
                qmonitor.addCount(bigpipe.monitor + '_rendlayout_error');
                bigpipe.catch(err);
            });
    },

    /**
     * 按照指定的pagelet的顺序输出到客户端，异步渲染，flush chunk to client as soon as possible with order
     * @return {} [description]
     */
    renderPipeline: function() {
        var bigpipe = this;
        var layout = this._layout;

        var pageletOrder = [];
        var pageletOrderMap = {};

        this.renderLayout().then(function() {

            bigpipe._pagelets.forEach(function(pagelet) {
                pageletOrder.push(pagelet.name);

                pagelet.once('active', function(chunk) {
                    pageletOrderMap[pagelet.name] = {
                        name: pagelet.name,
                        ready: true,
                        flushed: false,
                        chunk: chunk
                    };

                    flushPagelets();
                });

                pagelet.render();
            });

            function flushPagelets() {
                for(var i = 0, len = pageletOrder.length; i < len; i++) {
                    var pl = pageletOrderMap[ pageletOrder[i] ];

                    // haven't render ready
                    if(!pl || !pl.ready) {
                        break;
                    }

                    // flush once
                    if(!pl.flushed) {
                        bigpipe.queue(pl.name, pl.chunk).flush();
                        pl.flushed = true;
                    }

                    // last one
                    if(i === (len - 1)) {
                        layout.end();
                    }
                }
            }

        });
    },

    /**
     * 渲染模块的json数据
     * @param  {Array} modules 需要渲染的模块名称数组
     * @return {Promise}         获取json数据并返回到客户端
     */
    renderJSON: function(modules) {

        var bigpipe = this;
        bigpipe.length = modules.length;
        if(!modules || !modules.length) {
            logger.error('处理失败,没有传入需要处理的模块');
            bigpipe._json({
                status: 500,
                message: '未获取到数据'
            });
        }

        logger.info('开始处理JSON接口数据, 模块['+ modules.join(' | ') +']');

        Promise.map(modules, function(modName) {

            if(_.isFunction(modName)) {
                modName = modName.prototype.name;
            }

            var mod = bigpipe._pageletMap[modName];
            /**
             * [{key1: '..'}, {key1: '..'}]
             */
            return mod.get().then(function (data) {
                return {[mod.name]: data};
            });


        }).then(function(data) {
            logger.record('获取API接口数据成功');
            bigpipe._json(data);
        }, function (data) {
            logger.record('获取API接口数据失败');
        }).catch(function(error) {
            logger.error('处理JSON数据接口错误', error);
            var errObj = bigpipe.getErrObj(error);
            bigpipe._json(errObj);
        });

    },

    renderSingleJSON: function (modName) {
        var bigpipe = this;
        bigpipe.length = 1;

        if(!modName) {
            logger.error('处理失败,没有传入需要处理的模块');
            bigpipe._json({
                status: 500,
                message: '未获取到数据'
            });
        }

        if(_.isFunction(modName)) {
            modName = modName.prototype.name;
        }

        logger.info('开始处理JSON接口数据, 模块['+ modName +']');

        var mod = bigpipe._pageletMap[modName];

        return mod.get().then(function(data) {
            bigpipe._jsonSuc(data);
        }).catch(function(error) {
            logger.error('处理JSON数据接口错误', error);
            var errObj = bigpipe.getErrObj(error);
            bigpipe._json(errObj);
        });

    },

    /**
     * 渲染html片段
     * @param  {string} moduleName 需要渲染的模块名称
     * @return {Promise}            [description]
     */
    renderSnippet: function(moduleName) {
        var bigpipe = this;
        bigpipe.length = 1;

        if(!moduleName) {
            logger.error('处理失败,没有传入需要处理的模块');
            this._json({
                status: 500,
                message: '未获取到数据'
            });
        }

        if(_.isFunction(moduleName)) {
            moduleName = moduleName.prototype.name;
        }

        logger.info('开始处理html snippet接口数据, 模块['+ moduleName +']');

        var module = this._pageletMap[moduleName];

        // bigpipe._res.set('Content-Type', 'text/html; charset=utf-8');
        module.renderSnippet().then(function(snippet) {
            logger.record('获取snippet成功，flush到客户端'/*, snippet*/);
            module.end(snippet);
        }).catch(function(error) {
            logger.error('处理snippet数据错误', error);
            var errObj = bigpipe.getErrObj(error);
            bigpipe._json(errObj);
        });
    },

    _jsonSuc: function(json) {
        return this._json({
            status: 0,
            message: 'success',
            data: json
        })
    },

    /**
     * response json data to the client
     * @param  {Object|Array} data 需要render的原始数据，数组会被处理成Object
     */
    _json: function(data) {
        if(!data || _.isPlainObject(data)) {
            return this._res.json(data);
        }

        data = data.reduce(function (pre, cur) {
            return _.extend(pre, cur);
        }, {});

        this._res.json({
            status: 0,
            message: 'success',
            data: data
        });
    },

    /**
     * 根据error Object 获取error json
     * @param  {Object} error error stack 或者Object
     * @return {Object}       error json
     */
    getErrObj: function (error) {
        return {
            status: error.status || 502,
            message: (typeof error.status == 'undefined') ?
                '系统繁忙,请稍后重试' : (error.message || '系统繁忙,请稍后重试')
        }
    },

    /**
     * catch error
     * @param  {[type]} error [description]
     * @return {[type]}       [description]
     */
    catch: function(error) {
        if(this.isErrorFatal) {
            this.bigpipe.emit('page:error', error);
        }
        logger.error('catch error', error, '\n');
        return this.getErrObj(error);
    },

    renderError: function(error) {
        if(this.isSpider && BigPipe.optimizeForSeo) {
            // TODO 整体异常的时候能够同步渲染完整的页面
            logger.error('终止pagelet end @ spider', error);
            return;
        }

        logger.error('终止pagelet end', error);
        var html = this._errorPagelet.renderSyncWithData(error)
        this._errorPagelet.end(html, true);
    },

    destroy: function() {
        for(var k in this) {
            this.k = null;
        }
    }
};

// extend eventEmitter
_.extend(BigPipe.prototype, EventEmitter.prototype);

BigPipe.create = (function() {
    var __instance = {};

    return function(name, options) {

        if(!options) {
            options = name || {};
            name = 'defaults';
        }

        if(!__instance[name]) {
            __instance[name] = new BigPipe(name, options);
        }

        return __instance[name];
    }
})();

/**
 * 渲染是否真的seo做优化，即把bigpipe的异步渲染，转换成同步渲染，返回给spider
 */
BigPipe.setOptimizeForSeo = function(flag) {
    BigPipe.optimizeForSeo = !!flag;
};

// 全局开关等配置，目前支持的有
// errorPagelet 全局错误模块
// spiderReg 需要优化的搜索引擎 regexp
// optimizeForSeo seo优化开关
//
/**
 * 全局开关
 * @param  {string} key   config key
 * @param  {any} value config resource
 * @return {any}       如果只传入key，则获取，如果有value则赋值
 */
BigPipe.config = function(key, value) {
    if(!key || (typeof key !== 'string')) {
        return CONFIG;
    }
    if(!value) {
        return CONFIG[key];
    }

    CONFIG[key] = value;
};

// pageletName

function getPageletsName(pagelets) {
    if(typeof pagelets === 'string') {
        return pagelets;
    }

    if(_.isArray(pagelets)) {
        return pagelets.map(function (pre, cur) {
            return pre.prototype.name;
        }).join('|');
    }
}

// function noop
function NOOP() {}

module.exports = BigPipe;
