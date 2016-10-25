/**
 * @desc: modA
 * @authors: yongxiang.li
 * @date: 2016-09-12 19:48:33
 */


var Pagelet = require('../../../src/Pagelet');
//
// var Pagelet = require('bigape').Pagelet;
var serviceA = require('./service/testA');

module.exports = Pagelet.extend({
    name: 'modA',

    domID: 'mod-a',

    template: 'modA',

    // isErrorFatal: true,

    getService: function() {
        return serviceA.load(this.req, this.res);
        // return new Promise(function(resolve, reject) {
        //     setTimeout(function() {
        //         resolve('Async mod-A data');
        //     }, 500)
        // })
    },

    onServiceDone: function(data) {
        return data;
    },

    getPipeData: function(cache) {
        return cache;
    },

    // beforeRender: function(data) {
    //     var store = this.getStore();
    //     return {
    //         msg: 'parsed mod-a' + data.message,
    //         // dep: store.modC.msg,
    //         info: data
    //     }
    // }
});
