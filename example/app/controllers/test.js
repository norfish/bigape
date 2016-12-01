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

router.get('/', function(req, res, next) {
    return HomeAction
            .pipe([modB])
            .router(req, res, next)
            .renderAsync();
});

router.get('/api', function(req, res, next) {
    return HomeAction
        .pipe([modA, modB])
        .router(req, res, next)
        .renderJSON(['modA', 'modB']);
})

router.get('/snippet', function(req, res, next) {
    return HomeAction
        .pipe([modC])
        .router(req, res, next)
        .renderSnippet('modC');
})

module.exports = router;
