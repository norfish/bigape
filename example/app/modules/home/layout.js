/**
 * @desc: layout
 * @authors: Yex
 * @date: 2016-08-31 21:25:11
 */

var Pagelet = require('../../../../src/Pagelet');

var Layout = Pagelet.extend({
    name: 'layout',

    template: 'pages/home',

    getService: function() {
        return new Promise(function(resolve, reject) {
            setTimeout(function() {
                resolve('layout haha');
            }, 300);
        })
    }
});

module.exports = Layout;
