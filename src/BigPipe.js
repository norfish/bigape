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

function BigPipe(name, options) {

    this.bigpipe = this;

    // 标识符id，需要唯一
    this.name = name;

    this.options = options;

    // pagelet 缓存
    this._pageletCache = {};

    // pagelet cache data
    this.store = new Store(options.storeID || 'store');

    // pagelet module list
    this.pagelets = options.pagelets || {};

    // layout bootstrap
    this.layout = options.layout || options.bootstrap || {};

    // 错误module
    this.errorPagelet = options.errorPagelet || ErrorPagelet;

    // monitor key
    this.qmonitor = options.qmonitor;

    // 实例化的layout页面
    this._layout = null;

    // 实例化的页面片段集合
    this._pagelets = [];

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

    // this.initialize.apply(this, options);
}

BigPipe.prototype = {
    constructor: BigPipe,

    // buffer encoding charset
    charset: 'utf-8',

    initialize: function(options) {
        return this;
    },

    /**
     * 覆盖bigpipe的pagelet模块
     * @param  {Object} pageletsObj 模块map
     * @return {this}
     */
    usePagelets: function (pageletsObj) {
        this.pagelets = pageletsObj;
        return this;
    },

    // same with usePagelets
    pipe: function(pageletsObj) {
        this.pagelets = pageletsObj;
        return this;
    },

    /**
     * route 请求，每次处理新请求，需要更新bigpipe和对于模块的req,res,next
     * @return {this}
     */
    router: function(req, res, next) {
        logger.info('开始Bigpip, start router使用模块为['+ getPageletsName(this.pagelets) +']');
        qmonitor.addCount(this.qmonitor + '_page_visit');
        this.clear();

        this.bootstrap(req, res, next);
        this.createPagelets();
        this.start();

        return this;
    },

    clear: function() {
        this.store.clear();
        this._pageletCache = {};
        this._queue = [];
    },

    start: function() {
        var bigpipe = this;

        bigpipe._pagelets.forEach(function(pagelet, i) {
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
            // logger.info('analyze module done', pagelet.name);
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
        bigpipe._pageletCache[modName].get();

        return new Promise(function(resolve, reject) {
            // pagelet load and parse data ready
            bigpipe.on(modName + ':done', function(data) {
                bigpipe.store.set(modName, data);
                resolve({
                    name: modName,
                    data: data
                });
            });

            // pagelet处理数据失败
            bigpipe.on(modName + ':fail', function(data) {
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

        if (!this._queue.length) {
            this.emit('done');
        }

        // 确保不会在 end 之后再 write chunk
        if(this._res.finished) {
            // logger.error('Response was closed, unable to flush content');
            this.emit('end', new Error('Response was closed, unable to flush content'));
            // return;
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
        var _pagelets = this._pagelets = [];
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
            bigpipe._pageletCache[name] = newPagelet;
            _pagelets.push(newPagelet);
        });

        //refresh length + layout
        bigpipe.length = bigpipe.pagelets.length;

        return _pagelets;

    },

    /**
     * 获取pagelet and name
     * TODO 递归遍历找到所有的依赖pagelets
     * pagelet的名字如果没有指定的话则使用声明时候的name，如果在使用的时候有指定则覆盖
     * @return {Object} {pageletName: pageletClass}
     */
    _getAllPagelets: function() {

        var pagelets = this.pagelets;

        // TODO 为了兼容之前的API，需要后期统一成数组
        if(_.isPlainObject(this.pagelets)) {
               var temp = [];
               _.forIn(this.pagelets, function(pagelet){
                   temp.push(pagelet);
               });
               this.pagelets = pagelets = temp;
        }

        return this.pagelets.reduce(function(pre, pagelet) {
            var pgClass = pagelet.prototype;
            pre[pgClass.name] = pagelet;

            pgClass.wait.length && pgClass.wait.reduce(function(preWait, cur) {
                preWait[cur.prototype.name] = cur;
                return preWait;
            }, pre);

            return pre;
        }, {});
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
     * 异步渲染pagelets
     * @return {Object} Promise
     */
    renderAsync: function() {
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
            qmonitor.addCount(bigpipe.monitorKey + '_rendlayout_error');
            bigpipe.catch(err);
        });
    },

    render: this.renderAsync,

    /**
     * 同步渲染 pagelet 模块
     * @return {[type]} [description]
     */
    renderSync: function() {

    },

    /**
     * 渲染模块的json数据
     * @param  {Array} modules 需要渲染的模块名称数组
     * @return {Promise}         获取json数据并返回到客户端
     */
    renderJSON: function(modules) {

        var bigpipe = this;
        if(!modules || !modules.length) {
            logger.error('处理失败,没有传入需要处理的模块');
            bigpipe._json({
                status: 500,
                message: '未获取到数据'
            });
        }

        logger.info('开始处理JSON接口数据, 模块['+ modules.join(' | ') +']');

        Promise.map(modules, function(modName) {

            var mod = bigpipe._pageletCache[modName];
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
        if(!modName) {
            logger.error('处理失败,没有传入需要处理的模块');
            bigpipe._json({
                status: 500,
                message: '未获取到数据'
            });
        }

        logger.info('开始处理JSON接口数据, 模块['+ modName +']');

        var mod = bigpipe._pageletCache[modName];

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

        if(!moduleName) {
            logger.error('处理失败,没有传入需要处理的模块');
            this._json({
                status: 500,
                message: '未获取到数据'
            });
        }

        logger.info('开始处理html snippet接口数据, 模块['+ moduleName +']');

        var module = this._pageletCache[moduleName];

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
// BigPipe 一个页面一个
