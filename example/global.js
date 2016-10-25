var config = require('./config');
var logger = require('@qnpm/q-logger');
logger.init(config.logger);


global.__project = {
    path: __dirname
}