/**
 * @desc: index
 * @authors: Yex
 * @date: 2016-09-12 19:39:22
 */

var bigape = require('../../../../src');
// var Bigpipe = require('bigape');
var layout = require('./layout');
var modA = require('./modA');
var modB = require('./modB');
var modC = require('./modC');
var modD = require('./modD');

/**
 * modB
 * |- modA
 * 		|--modA_a
 * 		     |--modA_a_a
 * 		|--modA_b
 * |- modB
 */

var HomeAction = bigape.create('home', {
    bootstrap: layout,

    pagelets: [
        // modA,
        modB,
        // modC
    ]
});

module.exports = HomeAction;
