## 使用说明
> 目前该模块依赖一些内部的module，暂时不适合开放使用，如果有兴趣可以自行改造
> 目前我也在加紧改造中，希望能尽快开放

> 欢迎提issue和pull request

### Bigpipe 声明
```
var BigPipe = require('bigape').BigPipe;
var layout = require('./layout');
var modA = require('./modA');
var modB = require('./modB');
var modC = require('./modC');

// var errorPagelet = require('./errorPagelet');

var HomeAction = BigPipe.create('home', {
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
var BigPipe = require('../../libs/pipe/BigPipe');
var DemoAction = require(__project.modules + '/demo');
var modA = require(__project.modules + '/modA');
var modB = require(__project.modules + '/modB');
var modC = require(__project.modules + '/modC');

exports.render = function(req, res, next) {
    return DemoAction
            // 可以不写pipe，这样会使用Bigpipe声明的pagelets
            // 如果有写pipe则会覆盖pagelets
            // 可以使用array 或者 Object， Object的key为pagelet的name，会覆盖声明的值
            //  .pipe({
            //    modA: modA,
            //    modB: modB,
            //    modC: modC
            // })
            // .pipe([modA, modB, modC])
            .router(req, res, next)
            .renderAsync();
};

exports.renderJSON = function(req, res, next) {
    return DemoAction
        .pipe({
            modA: modA,
            modB: modB
        })
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
