/**
 * @desc: index
 * @authors: Yex
 * @date: 2016-09-27 13:42:41
 */

var BigPipe = require('./BigPipe');
var Pagelet = require('./Pagelet');
var Service = require('./Service');
var config = require('./config');

var bigape = {
  createPagelet(name, options) {
    if (!name) {
      throw 'please specify options when create pagelet';
    }
    if (!options) {
      options = name;
    } else {
      options.name = name;
    }

    return Pagelet.extend(options);
  },

  createService(options) {
    return Service.create.call(Service, options);
  },

  create(name, options) {
    if (!name) {
      throw 'please specify options when create bigPipe';
    }
    if (!options) {
      options = name;
    } else {
      options.name = name;
    }

    return BigPipe.create.call(BigPipe, options);
  },

  config(options) {
    if (!options) {
      throw 'options can not be empty';
    }
    return config.options.call(null, options);
  }
};

module.exports = bigape;
