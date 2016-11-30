/**
 * @desc: modA
 * @authors: Yex
 * @date: 2016-09-12 19:48:33
 */


var Pagelet = require('../../../../src/Pagelet');
//
// var Pagelet = require('bigape').Pagelet;
var serviceA = require('./service/testA');

var mockA = {
    ret: true,
    data: {
        info: 'demo data 1',
        message:' '
    }
};

module.exports = Pagelet.extend({
    name: 'modA',

    domID: 'mod-a',

    template: 'modA',

    noLog: true,

    // isErrorFatal: true,

    getService: function() {
        // return serviceA.load(this.req, this.res);
        return new Promise(function(resolve, reject) {
            setTimeout(function() {
                resolve(mockA);
            }, 500)
        })
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
