var express = require('express')
var router = express.Router()

var DemoAction = require('../pages/demo')

router.get('/', function(req, res, next) {
	DemoAction.router(req, res, next).renderAsync()
	// res.end('hello')
})

module.exports = router;
