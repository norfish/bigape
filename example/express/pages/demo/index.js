/**
 * index
 */

// var bigape = require('bigape')
var bigape = require('../../../../src')
var layout = require('./layout')
var modA = require('./modA')
var modB = require('./modB')
var modC = require('./modC')

var action = bigape.create('demoPage', {
  layout: layout,

  pagelets: [modA, modB, modC],

	// some actions
  actions: {
    render(req, res, next) {
      return this.router(req, res, next).renderAsync()
    },

    renderSync(req, res, next) {
      return this.router(req, res, next).pipe([modA, modB, modC]).renderSync()
    },

    renderPipeline(req, res, next) {
      return this.router(req, res, next).renderPipeLine()
    },

    renderJSON(req, res, next) {
      return this.router(req, res, next).renderJSON([modA])
    },

    renderSnippet(req, res, next) {
      return this.router(req, res, next).renderSnippet(modA)
    }
  }
})

module.exports = action
