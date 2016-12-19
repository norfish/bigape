/**
 * @desc: modD
 * @authors: Yex
 * @date: 2016-09-12 19:49:42
 */


var Pagelet = require('../../../../src/Pagelet');

module.exports = Pagelet.extend({
    name: 'modD',

    domID: 'mod-d',

    template: 'modD',

    getService: function() {
        return new Promise(function(resolve, reject) {
            setTimeout(function() {
                resolve('Async mod-D data');
            }, 100)
        })
    },

    onServiceDone: function(data) {
        return {
            msg: 'parsed mod-D'
        }
    },
});