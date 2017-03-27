/**
 * @desc: modA_a_a
 * @authors: Yex
 * @date: 2016-09-12 19:49:42
 */


var bigape = require('../../../../src');

module.exports = bigape.createPagelet({
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
