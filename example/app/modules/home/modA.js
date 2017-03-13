/**
 * @desc: modA
 * @authors: Yex
 * @date: 2016-09-12 19:48:33
 */


var Pagelet = require('../../../../src/Pagelet');
//
// var Pagelet = require('bigape').Pagelet;
var serviceA = require('./service/testA');
var modA_a =  require('./modA_a');
var modA_b =  require('./modA_b');

var _uid = 1;

var mockA = {
    ret: true,
    data: {
        info: 'demo data 1 哈哈测试',
        message:' 哈哈测试'
    }
};

module.exports = Pagelet.extend({
    name: 'modA',

    domID: 'mod-a',

    template: 'modA',

    // noLog: true,

    wait: [modA_a, modA_b],

    isErrorFatal: true,

    getService: function() {
        // throw new Error('test error');
        // return serviceA.load(this.req, this.res);
        return new Promise(function(resolve, reject) {
            setTimeout(function() {
                resolve(mockA);
            }, 100)
        })
    },

    onServiceDone: function(data) {
        console.log(this.name, '::', this.req.query, '::', _uid++);
        data = data.data;
        var modA_a = this.getStore('modA_a');
        data.msg = modA_a.msg;
        return data;
    },

    getPipeData: function(modData) {
        return modData;
    },

});
