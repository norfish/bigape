var express = require('express')
var router = express.Router()

var DemoAction = require('../pages/demo')

router.get('/', function(req, res, next) {
	DemoAction.router(req, res, next).renderAsync()
})

router.get('/sync', function(req, res, next) {
	DemoAction.router(req, res, next).renderSync()
})

router.get('/pipeline', function(req, res, next) {
	DemoAction.router(req, res, next).renderPipeline()
})

router.get('/json', function(req, res, next) {
	DemoAction.router(req, res, next).renderJSON()
})

router.get('/snippet', function(req, res, next) {
	DemoAction.router(req, res, next).renderSnippet('modA')
})

module.exports = router;
