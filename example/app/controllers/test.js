/**
 * @desc: test
 * @authors: Yex
 * @date: 2016-09-12 19:24:52
 */

var express = require('express');
var router = express.Router();

var Bigpipe = require('../../../src/Bigpipe');
var HomeAction = require('../modules/home');
var modA = require('../modules/home/modA');
var modB = require('../modules/home/modB');
var modC = require('../modules/home/modC');
var modD = require('../modules/home/modD');
var params = require('../modules/home/params')

router.get('/', function(req, res, next) {
    return HomeAction
            .pipe([modB, modD, modA, params])
            .router(req, res, next)
            .render();
});

// 异步渲染，顺序输出到客户端
router.get('/pipeline', function(req, res, next) {
    return HomeAction
            .pipe([modA, modB, modC])
            .router(req, res, next)
            .renderPipeline();
});

// 同步渲染，顺序输出到客户端
router.get('/sync', function(req, res, next) {
    return HomeAction
            .pipe([modA, modB, modC])
            .router(req, res, next)
            .renderSync();
});

router.get('/api', function(req, res, next) {
    return HomeAction
        .pipe([modC, modD])
        .router(req, res, next)
        .renderJSON(['modC', 'modD']);
});

router.get('/snippet', function(req, res, next) {
    return HomeAction
        .pipe([modC])
        .router(req, res, next)
        .renderSnippet('modC');
})


module.exports = router;
