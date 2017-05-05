[![Build Status](https://travis-ci.org/norfish/bigape.svg?branch=master)](https://travis-ci.org/norfish/bigape)
[![Coverage Status](https://coveralls.io/repos/github/norfish/bigape/badge.svg?branch=master)](https://coveralls.io/github/norfish/bigape?branch=master)
[![npm version](https://badge.fury.io/js/bigape.svg)](https://badge.fury.io/js/bigape)



## usage

> 注意： 1.x 版本依赖一些私有源的包，不适合使用，2.x 之后是公开版


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

    /** 
     * 可以指定出现异常时候的错误模块,默认的template是 partials/error
     * 发生全局错误需要立刻终止的时候才会使用
     * 默认mode是layout,即插入到body中,不需要指定domid
     **/
    // errorPagelet: errorPagelet,

    /**
     * 在actions 里可以定义 controllers， 使用的时候会为 bigpipe 实例增加以 「$」 为前缀的方法
     */
    actions: {
      render(req, res, next) {
        return this.router(req, res, next).renderAsync()
      },

      renderSync(req, res, next) {
        return this
          // 必须先把req, res, next 传入
          .router(req, res, next)
          // pipe 方法可以覆盖原有的 pagelets 属性定义的模块，如果不调用，则使用 pagelets 声明的模块
          .pipe([modA, modB, modC])
          // 指定以何种方式渲染
          .renderSync()
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

    // 返回到客户端的数据 key， 通过 BigPipe.getData('key') 获取
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

    // 如果该模块出现错误，是否需要立即终止pagelet响应，直接返回错误模块
    isErrorFatal: false,

    // 依赖的模块，可以传入模块名字或者模块类
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

    // 返回给客户端的数据，如果未声明该方法，则不返回客户端数据
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
