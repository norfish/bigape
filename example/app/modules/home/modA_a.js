/**
 * @desc: modA_a
 * @authors: Yex
 * @date: 2016-09-12 19:49:42
 */


var Pagelet = require('../../../../src/Pagelet');
var modA_a_a = require('./modA_a_a');

module.exports = Pagelet.extend({
    name: 'modA_a',
    template: 'modA',
    wait: [modA_a_a],
    onServiceDone: function(data) {
        var modA_a_a = this.getStore('modA_a_a');
        return {
            msg: 'parsed modA_a' + '||' + modA_a_a.msg
        }
    },

    getService: function() {
        return new Promise(function(resolve, reject) {
            setTimeout(function() {
                resolve('Async modA_a data');
            }, 50)
        })
    }
});
