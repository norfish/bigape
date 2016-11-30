/**
 * @desc: Store
 * @authors: Yex
 * @date: 2016-10-18 17:51:48
 */

var _ = require('lodash');

var Store = function(prefix, initModel) {
    this._store = {};
};

Store.prototype = {
    constructor: Store,

    set: function(name, data) {
        if(!name) {
            return this;
        }

        if(_.isPlainObject(name)) {
            _.assign(this._store, name);
        }

        this._store[name] = data;
        return this;
    },

    get: function(name) {
        if(!name) {
            return _.assign({}, this._store);
        }

        return  _.assign({}, this._store)[name] || null;
    },

    clear: function() {
        this._store = {};
    }
};

module.exports = Store;
