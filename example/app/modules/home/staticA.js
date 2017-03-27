/**
 * Description:
 * Created by Yex
 * Email Yex@qunar.com
 * Date: 2016/9/26 21:52
 */


var bigape = require('../../../../src');

module.exports = bigape.createPagelet({
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
