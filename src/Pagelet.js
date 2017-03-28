/**
 * @desc: Pagelets
 * @authors: Yex
 * @date: 2016-08-03 20:32:19
 *
 *
 */

'use strict';

var EventEmitter = require('events').EventEmitter;
var _ = require('lodash');
var config = require('./config');
// var monitor = config.plugins('monitor'); //require('@qnpm/q-monitor');
var debug = require('debug'); //require('@qnpm/q-logger');
var logger = debug('bigape');
var errorLog = debug('bigape:error');
// TODO: when use bluebird, when write after end error occured, cpu will increase to 100%, use default promise will be ok
// var Promise = require('bluebird');
var util = require('./util');

function Pagelet(name, options) {
    // pagelet uid
    this.name = name;

    // request
    this.req = options.req;

    // response
    this.res = options.res;

    // bigpipe 实例
    this.bigpipe = options.bigpipe;

    // 脚手架模块实例
    this._bootstrap = options.layout || options.bootstrap;

    // 适配
    this.adapt();

    // 生命周期 created
    this.onCreated();

    // emitter
    this.setMaxListeners(100);
}

Pagelet.prototype = {
    constructor: Pagelet,

    monitor: '',

    name: '',

    domID: '',

    // template
    template: '',

    // 渲染模式 append html prepend layout remove
    mode: 'html',

    // 脚本x`x``
    scripts: '',

    /**
     * 样式
     * @type {String}
     */
    styles: '',

    // 需要依赖的模块
    wait: [],

    // 是否是关键性的模块, 如果出错了是否立即终止请求，并返回错误
    isErrorFatal: false,

    // 发生错误时候渲染错误页面的模板
    errorTemplate: 'partials/error.njk',

    // 不输出该模块的logs，主要是数据logs
    noLog: false,

    // pagelet data 的 key， 默认为name
    dataKey: '',

    /**
     * 生命周期函数 pagelet 实例初始化之后
     * @return {[type]} [description]
     */
    onCreated: function() {},

    /**
     * beforeRender lifyCycle function
     * @param  {Object} data the parsed data after onServiceDone
     * @return {any}
     */
    onBeforeRender: function(data) {
        return data;
    },

    /**
     * 钩子函数（hook function），获取 pagelet 的原始数据
     * 获取渲染的原始数据 可以被覆盖，默认是通过service取接口数据，返回promise
     * 支持返回同步数据或者Promise异步
     * @return {[type]} [description]
     */
    getService: function() {
        return null;
    },

    /**
     * 适配器，为了兼容老的(1.0.x)api
     */
    adapt: function() {
        this.dataKey = this.pageletDataKey || this.dataKey;
        this.getService = this.getRenderData || this.getService;
        this.onServiceDone = this.beforeRender || this.onServiceDone;
        this.name = this.name || this.id;
        this.template = this.template || this.templateID;
    },

    bootstrap: function(value) {
        if(!value) {
            return !this._bootstrap && this.name === 'bootstrap' ? this : this._bootstrap || {};
        }
        if (value && value.name === 'bootstrap') {
            return this._bootstrap = value;
        }
    },

    /**
     * 通用的获取本模块的pagelet数据的方法，返回Promise
     * @return {Object} Promise
     */
    get: function() {
        var pagelet = this;

        // 因为是异步，防止被多次调用，造成资源浪费
        if(this._isGetting) {
            return this._isGetting;
        }

        this._isGetting = this.ready()
            .then(function() {
                return pagelet.getServiceData();
            })
            .then(function(data) {
                data = pagelet.onServiceDone(data);
                pagelet.setCache(data);
                logger(
                    '数据处理成功，触发事件['+ pagelet.name +':done]',
                    pagelet.noLog ? '{noLog}' : JSON.stringify(data)
                );
                pagelet.bigpipe.emit(pagelet.name + ':done', data);
                return data;
            })
            .catch(function(error) {
                errorLog('数据处理异常', error);
                pagelet.catch(error);
            });

        return this._isGetting;
    },

    /**
     * 依赖数据已经ready，本模块可以正常render
     * @param  {string} done 是否已经ready
     * @return {Object}        Promise
     */
    ready: function(done) {
        if(!this._ready) {
            this._ready = new Promise(function(resolve) {
                this.once('ready', function() {
                    resolve(null);
                });
            }.bind(this))
        }

        if(done) {
            this.emit('ready');
        }

        return this._ready;
    },

    /**
     * 生命周期，获取原始数据成功之后，一般用来处理原始数据，并返回
     * 处理通过getService获取的原始数据
     * @param  {Object} json 原始数据
     * @return {Object}      处理之后的数据
     */
    onServiceDone: function(json) {
        return json;
    },

    /**
     * 生命周期函数，渲染 html 片段完成之后
     * @param  {string} html html string
     * @return {string}      html string
     */
    afterRender: function(html) {
        return html;
    },

    /**
     * 执行pagelet的渲染,
     * @param {Object} renderData 可选,如果传入则直接使用该数据渲染,否则通过service调用获取数据
     */
    render: function(renderData) {
        var pagelet = this;
        logger('开始渲染Pagelet模块['+ pagelet.name +']@', new Date());

        if(renderData) {
            this.setCache(renderData);
        }

        return this.getRenderHtml()
            .then(function(source) {
                logger('xxx')
                var chunk = pagelet.createChunk(source);
                pagelet.emit('active', chunk);
                return chunk;
            })
            .catch(function(err) {
                var msg = '系统繁忙，请稍后重试' + err.message;
                errorLog('Pagelet render error::', err);
                pagelet.catch(err);
                pagelet.emit('active', msg);
                return msg;
            })
    },

    /**
     * 渲染html-fragment 片段
     * @param  {String} html render result
     * @return {String}      处理之后的数据
     */
    renderSnippet: function(renderData) {
        var pagelet = this;

        if(renderData) {
            this.setCache(renderData);
        }

        return this.getRenderHtml()
            .then(function(html) {
                return html;
            })
            // handle error
            .catch(function(err) {
                errorLog('Pagelet render snippet error::', err);
                return pagelet.catch(err);
            });
    },

    renderSyncWithData: function (data) {
        if(typeof this.onBeforeRender(data) === 'function') {
            this.onBeforeRender(data);
        }

        var viewEngine = config.config('viewEngine'); //require('jnpm-template');
        var html = viewEngine.render(this.getTemplatePath(), data);
        return this.createChunk(html);
    },

    /**
     * 暴露出的获取本pagelet数据的函数  readonly
     * @return {Object} parsed pagelet data {name: data}  function(data){}
     */
    getServiceData: function() {
        var pagelet = this;

        // logger('开始获取数据['+ pagelet.name +']');

        // 优先使用缓存数据
        // 避免重复获取数据
        var _cache = this.getCache();
        if(_cache) {
            logger('使用数据缓存['+ pagelet.name +']'/*, _cache*/);
            return Promise.resolve(_cache);
        }

        var getOriginData = this.getService();

        // 如果数据可以同步, 直接返回同步数据
        if(!util.isPromise(getOriginData)) {
            // logger('使用同步方式获取数据['+ pagelet.name +']');
            logger('获取模块数据成功['+ pagelet.name +']');
            getOriginData = Promise.resolve(getOriginData);
        }

        return getOriginData.then(function(json) {
            logger('获取模块数据成功['+ pagelet.name +']');
            return json;

        }, function(error) {
            errorLog('获取pagelet数据失败', pagelet.name, error);
            return pagelet.catch(error);

        }).catch(function(error) {
            // monitor.addCount('module_handler_error');
            errorLog('获取pagelet数据异常', pagelet.name, error);
            return pagelet.catch(error);
        });
    },

    /**
     * 获取 html 片段渲染结果
     * @return {Object} Promise   function(html){};
     */
    getRenderHtml: function() {
        var pagelet = this;
        var viewEngine = config.config('viewEngine'); //require('jnpm-template');

        return this.get()
            .then(function(parsed) {
                if(typeof pagelet.onBeforeRender(parsed) === 'function') {
                    pagelet.onBeforeRender(parsed);
                }

                // 统一为渲染数据增加locals参数
                return viewEngine.render(
                    pagelet.getTemplatePath(),
                    pagelet.getActRenderData(parsed)
                );

            // 模板渲染reject时候，渲染错误信息
            }, function(error) {
                errorLog('渲染pagelet失败', pagelet.name, error);
                var errorObj = pagelet.getErrObj(error);
                return viewEngine.render(pagelet.errorTemplate, errorObj);
            })
            .then(function(html) {
                return pagelet.afterRender(html);
            })
            .catch(function(error) {
                // monitor.addCount('module_render_error');
                errorLog('渲染pagelet异常', pagelet.name, error);
                return viewEngine.render(pagelet.errorTemplate, pagelet.getErrObj(error));
            });
    },

    getRenderChunk: function() {
        var pagelet = this;
        return this.getRenderHtml()
            .then(function(html) {
                return pagelet.composeChunkObj(html);
            })
    },

    getTemplatePath: function() {
        if(!this.template) {
            return 'index.njk';
        }

        if(this.isBootstrap()) {
            return this.template;
            // return 'pages/' + this.template;
        } else {
            return 'partials/' + this.template;
        }
    },

    getActRenderData: function(parsed) {
        return {
            [this.renderDataKey || this.name]: parsed || null,
            locals: this.res.locals,
            query: this.req.query,
            // 页面统一增加 process env
            NODE_ENV: process.env.NODE_ENV
        }
    },

    /**
     * 生成数据块
     * @param {String} html
     */
    createChunk: function(html) {
        // 如果是主框架则直接返回
        if(this.isBootstrap()) {
            return html;
        }

        var chunkObj = this.composeChunkObj(html);

        return '<script>BigPipe.onArrive('+ JSON.stringify(chunkObj) +')</script>'
    },

    /**
     * 拼接pagelet chunk Object
     * @param  {string} html rendered html string
     * @return {Object}      chunk
     */
    composeChunkObj: function(html) {
        // 如果是主框架则直接返回
        if(this.isBootstrap()) {
            return html;
        }

        return {
            id: this.name,
            html: html,
            scripts: this.scripts,
            data: this.getPipeData(this.getCache()),
            styles: this.styles,
            domID: this.domID,
            modID: this.name,
            mode: this.mode,
            dataKey: this.dataKey || this.name,
            dataEventName: this.dataEventName || this.dataKey || this.name,
            pageletEventName: this.pageletEventName || this.domID || this.name
        };
    },

    /**
     * 钩子函数（hook function），获取传递给客户端的数据，默认返回空
     * @param  {Object} modData 本模块的数据
     * @return {*}     返回给客户端的数据
     */
    getPipeData: function () {
        return null;
    },

    /**
     * 是否是基础模块
     * @return {Boolean}
     */
    isBootstrap: function() {
        return this.name == 'layout' || this.name == 'bootstrap';
    },

    /**
     * flush
     * @return {[type]} [description]
     */
    flush: function() {
        this.bigpipe.flush();
    },

    /**
     * flush
     * @param  {[type]} name  [description]
     * @param  {[type]} chunk [description]
     * @return {[type]}       [description]
     */
    write: function(name, chunk) {
        if (!chunk) {
            chunk = name;
            name = this.name;
        }

        return this.bigpipe.queue(name, chunk);
    },

    /**
     * end flush
     * @param  {[type]} chunk [description]
     * @param  {Boolean} force 是否强制结束
     * @return {[type]}       [description]
     */
    end: function(chunk, force) {

        var pagelet = this;

        if (chunk) this.write(chunk);

        //
        // Do not close the connection before all pagelets are send unless force end.
        //
        if (this.bigpipe.length > 0 && !force) {
            return false;
        }

        //
        // Everything is processed, close the connection and clean up references.
        //
        this.bigpipe.flush(function close(error) {
            if (error) return pagelet.catch(error, true);
            logger('Bigpipe end @', new Date());
            pagelet.res.end('</html>');
        });

        return true;
    },

    /**
     * 根据error Object 获取error json
     * @param  {Object} error error stack 或者Object
     * @return {Object}       error json
     */
    getErrObj: function (error) {
        return {
            status: error.status || error.code || 502,
            message: (error.status || error.code) ?
                (error.message || '系统繁忙,请稍后重试') : '系统繁忙,请稍后重试'
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
        errorLog('catch error', error, '\n');
        return this.getErrObj(error);
    },

    getStore: function() {
        var store = this.bigpipe.store;
        return store.get.apply(store, arguments);
    },

    setStore: function() {
        var store = this.bigpipe.store;
        return store.set.apply(store, arguments);
    },

    getCache: function() {
        return this.getStore(this.name);
    },

    setCache: function(data) {
        return this.setStore(this.name, data);
    }
}

/*###########################*
 * 类继承
 *##########################*/

// extend eventEmitter
_.extend(Pagelet.prototype, EventEmitter.prototype);

Pagelet.extend = util.extend;

Pagelet.create = (function() {
    var __instance = {};

    return function(name, options) {
        if(!options) {
            options = name || {};
            name = 'defaults';
        }

        __instance[name] = new this(name, options);
        return __instance[name];
    }
})();

module.exports = Pagelet;
