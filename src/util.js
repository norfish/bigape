/**
 * @desc: util
 * @authors: Yex
 * @date: 2016-10-24 20:45:02
 */


var util = {

    isPromise: function(fn) {
        return fn && typeof fn.then !== 'undefined';
    },

    /**
     * extend
     * @param  {Object} props  子类属性
     *                 constructor: 构造器属性
     *                 static: 静态属性
     * @return {Object}        子类
     */
    extend: function(props) {

        var parent = this;
        var child;

        if(props && props.hasOwnProperty('constructor')) {
            child = function(){
                parent.apply(this, arguments);
                props.constructor.apply(this, arguments);
            }

            //delete props.constructor;
        } else {
            child = function() {
                return parent.apply(this, arguments);
            }
        }

        // staticProps
        Object.assign(child, parent);
        if(props && props.hasOwnProperty('static')) {
            Object.assign(child, props.static);
            delete props.static;
        }

        // extend
        child.prototype = Object.create(this.prototype);

        // child props
        if(props) {
            Object.assign(child.prototype, props);
        }

        // inject props
        // injectChild(child);

        child.__super__ = parent.prototype;

        return child;
    }
};

module.exports = util;
