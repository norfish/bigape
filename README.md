## 使用说明
> 目前该模块依赖一些内部的module，暂时不适合开放使用，如果有兴趣可以自行改造
> 目前我也在加紧改造中，希望能尽快开放

> 欢迎提issue和pull request

> this module depend on some private module, so it can not used for public
> the public common module is under working now, please wait for a few days


## release

### 1.2.7
- add: BigPipe 增加了init属性，支持给bigpipe增加自定义实例属性
- add: 支持init里指定渲染方法
- add: renderSnippet/renderJSON 支持直接传入module原型

*bugfix：*
- fix: renderSnippet/renderJSON 方法只传入module或者moduleName，不重新指定pipe，导致无法flush到客户端的bug


### 1.2.4
- 增加 renderAsync 的别名 render方法 √
- 增加 renderPipeline 方法，异步渲染，按顺序输出 √


### 1.2.0 - 1.2.3

##### 新特性
- pagelet 增加 noLog 配置，允许 pagelet 不输出logs √
- 允许指定pagelet渲染数据的 renderDataKey，如果不指定还是默认取name值 √
- service 允许自定义header, 新增 getHeaders 方法 √
- service 允许自定义proxy代理 √


##### bugfix
- pagelet 多层数据依赖 √
- log日志输出，对于json，会stringify格式化输出 √

### 1.1.0
- 故障fix √

### 1.0.x

- pagelet 模块基本
- bigpipe 基本模块
- service 原始wiki

### Bigpipe 声明
```
var Bigpipe = require('bigape').Bigpipe;
var layout = require('./layout');
var modA = require('./modA');
var modB = require('./modB');
var modC = require('./modC');

// var errorPagelet = require('./errorPagelet');

var HomeAction = Bigpipe.create('home', {
    bootstrap: layout,

    pagelets: [modA, modB, modC],

    // pagelets: {
    //    modA: modA,
    //    modB: modB,
    //    modC: modC
    // },

    // 可以指定出现异常时候的错误模块,默认的template是 partials/error
    // 发生全局错误需要立刻终止的时候才会使用
    // 默认mode是layout,即插入到body中,不需要指定domid
    // errorPagelet: errorPagelet
});

module.exports = HomeAction;
```

### Pagelet 声明

```
var Pagelet = require('bigape').Pagelet;

module.exports = Pagelet.extend({
    name: 'modA',

    domID: 'mod-a',

    template: 'modA',

    qmonitor: '',

    // 默认path  发生模块处理异常的时候的模板
    errorTemplate: 'partials/error',

    // 渲染模式 append html prepend layout remove, 默认html即innerHtml
    mode: 'html',

    // 脚本x`x``
    scripts: '',

    /**
     * 样式
     * @type {String}
     */
    styles: '',

    // 默认和name相同
    dataKey: 'modA',

    // 默认和name相同
    dataEventName: 'modA',

    // 默认false， 模块是否是关键，如果出错是否需要立刻终止，end
    isErrorFatal: false,

    // 需要依赖的模块
    wait: ['modB'],

    /**
     * 获取渲染的原始数据 可以被覆盖，默认是通过service取接口数据，返回promise
     * 支持返回同步数据或者Promise异步
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
     * @param  {Object} json 原始数据
     * @return {Object}      处理之后的数据
     */
    onServiceDone: function(data) {

        // data 是service 处理之后的原始数据
        //
        //

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
var Bigpipe = require('../../libs/pipe/Bigpipe');
var DemoAction = require(__project.modules + '/demo');
var modA = require(__project.modules + '/modA');
var modB = require(__project.modules + '/modB');
var modC = require(__project.modules + '/modC');

exports.render = function(req, res, next) {
    return DemoAction
            // 可以不写pipe，这样会使用Bigpipe声明的pagelets
            // 如果有写pipe则会覆盖pagelets
            // .pipe([modA, modB, modC])
            .router(req, res, next)
            .render();  // same as: renderAsync();
};

// 异步渲染模块，顺序输出
exports.renderPipeline = function(req, res, next) {
    return DemoAction
        .pipe([modB, modA, modC])
        .router(req, res, next)
        .renderPipeline();
};

exports.renderJSON = function(req, res, next) {
    return DemoAction
        .pipe([modA, modB])
        .router(req, res, next)
        .renderJSON(['modA', 'modB']);
};

exports.renderSnippet = function(req, res, next) {
    return DemoAction
        .pipe({
            modC: modC
        })
        .router(req, res, next)
        .renderSnippet('modC');
};

```
