/**
 * @desc: util
 * @authors: yongxiang.li
 * @date: 2016-10-24 20:45:02
 */

var logger = require('@qnpm/q-logger');

var util = {

    isPromise: function(fn) {
        return fn && typeof fn.then !== 'undefined';
    }
};

module.exports = util;
