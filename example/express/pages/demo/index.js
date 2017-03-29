/**
 * index
 */

var bigape = require('../../../../src')
var layout = require('./layout')
var modA = require('./modA')
var modB = require('./modB')
var modC = require('./modC')

var action = bigape.create('demoPage', {
	layout: layout,

	pagelets: [modA, modB, modC]
})

module.exports = action
