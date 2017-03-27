/**
 * @desc: modC
 * @authors: Yex
 * @date: 2016-09-12 19:49:42
 */


var bigape = require('../../../../src');
var _uid = 1;

module.exports = bigape.createPagelet({
    name: 'modC',

    domID: 'mod-c',

    template: 'modC.njk',

    getService: function() {
        return new Promise(function(resolve, reject) {
            setTimeout(function() {
                resolve('Async mod-C data');
            }, 10)
        })
    },

    onServiceDone: function(data) {
        console.log(this.name, '::', this.req.query, '::', _uid++);
        return {
            msg: 'parsed mod-C'
        }
    },
});
