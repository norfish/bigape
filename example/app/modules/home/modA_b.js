/**
 * @desc: modA_b
 * @authors: Yex
 * @date: 2016-09-12 19:49:42
 */


var bigape = require('../../../../src');

module.exports = bigape.createPagelet({
    name: 'modA_b',
    template: 'modA',
    onServiceDone: function(data) {
        return {
            msg: 'parsed modA_b'
        }
    },

    getService: function() {
        return new Promise(function(resolve, reject) {
            setTimeout(function() {
                resolve('Async modA_b data');
            }, 15)
        })
    }
});

/**
 * in order
 *
 * get order
 *
 * 每次render结束
 *
 */
