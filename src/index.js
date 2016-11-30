/**
 * @desc: index
 * @authors: Yex
 * @date: 2016-09-27 13:42:41
 */

var Bigpipe = require('./Bigpipe');
var Pagelet = require('./Pagelet');
var Service = require('./Service');

module.exports = {
    // 为了兼容1.0.x的版本
    BigPipe: Bigpipe,
    Bigpipe: Bigpie,
    Pagelet: Pagelet,
    Service: Service
};
