/**
 * @desc: modB
 * @authors: Yex
 * @date: 2016-09-12 19:49:28
 */


var bigape = require('../../../../src');
var modC = require('./modC');
var modA = require('./modA');
var _uid = 1;

module.exports = bigape.createPagelet({
    name: 'modB',

    domID: 'mod-b',

    template: 'modB.njk',

    wait: [modA, modC],

    getService: function() {
        return new Promise(function(resolve, reject) {
            setTimeout(function() {
                resolve('Async mod-B data');
            }, 300)
        })
    },

    onServiceDone: function(data) {
        console.log(this.name, '::', this.req.query, '::', _uid++);
        var store = this.getStore();
        return {
            msg: 'parsed mod-b' + data.info,
            dep: store.modA.info + '||' + store.modC.msg + '||' + store.modA.msg,
            info: store.modA.info
        }
    },
});
