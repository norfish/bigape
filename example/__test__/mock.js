/**
 * @desc: mock
 * @authors: yongxiang.li
 * @date: 2016-09-12 19:12:53
 */

var nock = require('nock');
var demoData = require('./data/demoData');

nock('http://user.jiulvxing.com/ucenter/verify')
    .get('/a')
    .reply(200, demoData.data1);

nock('http://user.jiulvxing.com/ucenter/verify')
    .get('/a')
    .reply(200, demoData.data1);

nock('http://127.0.0.1/1337/api')
    .get('/b')
    .reply(200, demoData.data2);

nock('http://127.0.0.1/1337/api')
    .get('/c')
    .reply(200, demoData.data3);
