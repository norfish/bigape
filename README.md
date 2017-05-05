[![Build Status](https://travis-ci.org/norfish/bigape.svg?branch=master)](https://travis-ci.org/norfish/bigape)
[![Coverage Status](https://coveralls.io/repos/github/norfish/bigape/badge.svg?branch=master)](https://coveralls.io/github/norfish/bigape?branch=master)
[![npm version](https://badge.fury.io/js/bigape.svg)](https://badge.fury.io/js/bigape)


=============================================================================

[中文文档](https://github.com/norfish/bigape/blob/master/README.zh-ch.md)


## usage

> 注意： 1.x 版本依赖一些私有源的包，不适合使用，2.x 之后是公开版
> attention: 1.x is private usage, 2.x is for public


### create bigPipe and controllers
```
var bigape = require('bigape');
var layout = require('./layout');
var modA = require('./modA');
var modB = require('./modB');
var modC = require('./modC');

// var errorPagelet = require('./errorPagelet');

var HomeAction = bigape.create('home', {

    // bootstrap pagelet
    bootstrap: layout,

    // pagelets
    pagelets: [modA, modB, modC],

    // 可以指定出现异常时候的错误模块,默认的template是 partials/error
    // 发生全局错误需要立刻终止的时候才会使用
    // 默认mode是layout,即插入到body中,不需要指定domid
    /**
     * you can specify the template when page error occured
     * default is partials/error.njk
     * default append mode is layout(append to body)
     */
    // errorPagelet: errorPagelet,

    // you can define controllers in bigape actions, and then you can call these method with `$` prefixed, like: homeAction.render(req, res, next)
    // or you can write controllers in a stand file as follow
    actions: {
      render(req, res, next) {
        return this.router(req, res, next).renderAsync()
      },

      renderSync(req, res, next) {
        return this.router(req, res, next).pipe([modA, modB, modC]).renderSync()
      },

      renderPipeline(req, res, next) {
        return this.router(req, res, next).renderPipeLine()
      },
    }
});

module.exports = HomeAction;
```

### create Pagelet

```
var bigape = require('bigape');

module.exports = bigape.createPagelet({
    name: 'modA',

    domID: 'mod-a',

    // template path, 
    template: 'modA.njk',

    // monitor key
    monitor: '',

    // you can specify the data key (the data flushed to client)
    // default is pagelet.name
    dataKey: 'modA',

    // 默认path  发生模块处理异常的时候的模板
    // error template path
    errorTemplate: 'partials/error',

    // 渲染模式 append html prepend layout remove, 默认html即innerHtml
    // the mode that how pagelet append to the body in client
    // default is html document.querySelector('#domId').innerHtml
    // [html prepend layout remove]
    mode: 'html',

    // 脚本x`x``
    scripts: '',

    /**
     * 样式
     * @type {String}
     */
    styles: '',

    // should the end the response when error occured, default is false
    isErrorFatal: false,

    // depended modules
    wait: ['modB'],

    /**
     * 获取渲染的原始数据 可以被覆盖，默认是通过service取接口数据，返回promise
     * 支持返回同步数据或者Promise异步
     * lifyCycle: get raw data
     * return the raw data, promise is also supported
     * @return {[type]} [description]
     */
    getService: function() {
      return new Promise(function(resolve, reject) {
        setTimeout(function() {
          resolve('Async mod-A data');
        }, 500)
      })
    },

    /**
     * 处理通过getService获取的原始数据
     * lifyCycle after getService, parse the raw data
     * @param  {Object} json raw data
     * @return {Object}      parsed data
     */
    onServiceDone: function(data) {

      // 获取全量的依赖数据
      var store = this.getStore();
      var modB = this.getStore('modB');
      var modData = this.getCache() || this.getStore('modA');

      if(data.status !== 0) {
        //...
      }

      return {
        msg: 'parsed mod-a' + data.info,
        // dep: store.modC.msg,
        info: data
      }
    },

    // 返回给客户端的数据，默认为null
    // the data flushed to client, default is null
    getPipeData: function(modData) {
      return modData;
    },

    // 内部方法不可改
    // 渲染模板
    //
    // 数据是以本模块的名字为key的对象  类似
    // {modA: something}
    //
    [renderHtml]: function(path, data) {
        return html;
    }
});

```

### Controller
```
var bigape = require('bigape');
var DemoAction = require('./demo');
var modA = require('./modA');
var modB = require('./modB');
var modC = require('./modC');

// render async and flush async
exports.render = function(req, res, next) {
  return DemoAction
    // you can use pipe method to overwrite the pagelets that specify in bigape
    // .pipe([modA, modB, modC])
    .router(req, res, next)
    .render();  // same as: renderAsync();
};

// render async and flush pipeline
exports.renderPipeline = function(req, res, next) {
  return DemoAction
    .router(req, res, next)
    .renderPipeline();
};

// render all pagelet to static layout and flush to client at once, for seo
exports.renderSync = function(req, res, next) {
  return DemoAction
    .router(req, res, next)
    .renderSync();
}

// just get the data and flush json to client
exports.renderJSON = function(req, res, next) {
  return DemoAction
    .router(req, res, next)
    .renderJSON()
    // you can specify which module to render
    /*.renderJSON(['modA', 'modB']);*/
};

// render one modules static html and flush to client
exports.renderSnippet = function(req, res, next) {
  return DemoAction
    .router(req, res, next)
    .renderSnippet('modC');
};

```

### PS
one more thing, you should turn off the server's buffer when you want the benifit of bigpipe

```
  res.setHeader('X-Accel-Buffering', 'no')
```
