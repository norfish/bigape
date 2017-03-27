/**
 * @desc: layout
 * @authors: Yex
 * @date: 2016-08-31 21:25:11
 */

var bigape = require('../../../../src');

var Layout = bigape.createPagelet({
    name: 'layout',

    template: 'pages/home.njk',

    getService: function() {
        return new Promise(function(resolve, reject) {
            setTimeout(function() {
                resolve('layout haha');
            }, 300);
        })
    }
});

module.exports = Layout;
