var express = require('express')
var router = express.Router()

var DemoAction = require('../pages/demo')

router.get('/', function(req, res, next) {
 DemoAction.$render(req, res, next)
})

router.get('/sync', function(req, res, next) {
  DemoAction.$renderSync(req, res, next)
})

router.get('/pipeline', function(req, res, next) {
  DemoAction.$renderPipeline(req, res, next)
})

router.get('/json', function(req, res, next) {
	// DemoAction.router(req, res, next).renderJSON()
  DemoAction.$renderJSON(req, res, next)
})

router.get('/snippet', function(req, res, next) {
	// DemoAction
	// 	.router(req, res, next)
	// 	.renderSnippet('modA')
  DemoAction.$renderSnippet(req, res, next)
})

module.exports = router;
