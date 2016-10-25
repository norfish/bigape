/**
 * @desc: index
 * @authors: yongxiang.li
 * @date: 2016-09-12 19:39:22
 */

var BigPipe = require('../../../src/BigPipe');
// var Bigpipe = require('bigape');
var layout = require('./layout');
var modA = require('./modA');
var modB = require('./modB');
var modC = require('./modC');

var HomeAction = BigPipe.create('home', {
    bootstrap: layout,

    pagelets: [modA, modB, modC]
});

module.exports = HomeAction;
