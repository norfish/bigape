/**
 * @desc: test
 * @authors: yongxiang.li
 * @date: 2016-09-12 19:24:52
 */

var BigPipe = require('../../src/BigPipe');
var HomeAction = require('../modules/home');
var modA = require('../modules/home/modA');
var modB = require('../modules/home/modB');
var modC = require('../modules/home/modC');

exports.render = function(req, res, next) {
    return HomeAction
            // .usePagelets({
            //     modA: modA,
            //     modB: modB,
            //     modC: modC
            // })
            .pipe([modA, modB, modC])
            .router(req, res, next)
            .renderAsync();
};

exports.renderJSON = function(req, res, next) {
    return HomeAction
        // .usePagelets({
        //     modA: modA,
        //     modB: modB,
        //     modC: modC
        // })
        .pipe([modA, modB])
        .router(req, res, next)
        .renderJSON(['modA', 'modB']);
};

exports.renderSnippet = function(req, res, next) {
    return HomeAction
        // .usePagelets({
        //     modC: modC
        // })
        .pipe([modC])
        .router(req, res, next)
        .renderSnippet('modC');
};
