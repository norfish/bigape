var express = require('express');
var router = express.Router();

var testController = require('./../app/controllers/test.js');

/* GET home page. */
router.get('/', function(req, res, next) {
    res.render('index', {
        title: 'hello Qxf'
    });
});

router.get('/test', testController.render)

router.get('/test/api', testController.renderJSON)

router.get('/test/snippet', testController.renderSnippet)

// check_url，发布使用，不要删除
router.get('/check_url', function(req, res, next) {
    res.end('check_url ok');
});

router.all('*', function(req, res, next) {
    res.statusCode = 403;
    res.end('403');
});

module.exports = router;
