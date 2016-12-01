/**
 * @desc: modA_a_a
 * @authors: Yex
 * @date: 2016-09-12 19:49:42
 */


var Pagelet = require('../../../../src/Pagelet');

module.exports = Pagelet.extend({
    name: 'modA_a_a',
    template: 'modA',
    onServiceDone: function(data) {
        return {
            msg: 'parsed modA_a_a'
        }
    },

    getService: function() {
        return new Promise(function(resolve, reject) {
            setTimeout(function() {
                resolve('Async modA_a_a data');
            }, 1000)
        })
    }
});
