/**
 * Description:
 * Created by yongxiang.li
 * Email yongxiang.li@qunar.com
 * Date: 2016/9/26 21:52
 */


var Pagelet = require('../../../../src/Pagelet');

module.exports = Pagelet.extend({
    name: 'staticA',

    domID: 'mod-a_1',

    template: 'staticA',

    getRenderData: function() {
        return {
            info: 'static-a data demo'
        }
    },

    beforeRender: function(data) {
        return {
            msg: 'parsed static-a' + data.info
        }
    }
});