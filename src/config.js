/**
 * @desc: config
 * @authors: yox
 * @date: 2017/3/24 上午11:56:47
 */

/**
 * plugins: {
 *  viewEngine: {
 *      module: 'jnpm-template',
 *  },
 *  logger: {
 *      module: 'debug'
 *  },
 *  monitor: {
 *      module: 'monitor'
 *  }
 * }
 */

var _ = require('lodash')

var PLUGINS = {
    viewEngine: {
        module: 'nunjucks'
    },
    logger: {
        module: 'debug'
    },
    monitor: {
        module: 'debug'
    }
}
var CONFIG = {}

var plugins = function(key, cfg) {
    if(!key) {
        return null;
    }

    if(_.isPlainObject(key)) {
        return Object.assign(PLUGINS, key);
    }

    if(!cfg) {
        var plugin = PLUGINS[key];
        if(plugin.module) {
            return require(plugin.module);
        }
    }

    PLUGINS[key] = cfg;
}

var config = function(key, cfg) {
    if(!key) {
        return null;
    }

    if(!cfg) {
        return CONFIG[key];
    }

    CONFIG[key] = cfg;
}

var configOrPlugins = function(opts) {
    if(!_.isPlainObject(opts)) {
        return;
    }

    _.forIn(opts, function(value, key) {
        if(key === 'plugins') {
            plugins(value);
        } else {
            config(key, value);
        }
    });
}

module.exports = {
    options: configOrPlugins,
    config,
    plugins
};
