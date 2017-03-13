/**
 * @desc: index
 * @authors: yongxiang.li
 * @date: 2016/11/30 下午4:51:25
 */

var express = require('express');
var router = express.Router();

var test = require('./test');


/* GET home page. */
router.get('/', function(req, res, next) {
    // res.render('index', {
    //     title: 'hello Qxf'
    // });
    res.write('send type 1');
    res.write('send type 2');
    res.end('send type 3');
    res.write('send type 4');
});

router.use('/test', test);

// check_url，发布使用，不要删除
router.get('/check_url', function(req, res, next) {
    res.end('check_url ok');
});

router.all('*', function(req, res, next) {
    res.statusCode = 403;
    res.end('403');
});

module.exports = router;
