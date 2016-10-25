/**
 * @desc: errorPagelet common
 * @authors: yongxiang.li
 * @date: 2016-10-24 17:40:39
 */

var Pagelet = require('./Pagelet');


module.exports = Pagelet.extend({
    name: 'error',

    domID: 'mod-error',

    template: 'error',

    mode: 'layout'
});
