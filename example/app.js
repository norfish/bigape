var http = require('http');
var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var compression = require('compression')

var qversion = require('@qnpm/q-version');
var healthcheck = require('@qnpm/q-healthcheck');
var qtemplate = require('jnpm-template');
var logger = require('@qnpm/q-logger');
var exception = require('@qnpm/q-exception');
var config = require('./config');

// 路由
var routes = require('./routes/index');

// 初始化express
var app = express();

// 初始化版本号，ref为版本号存放目录
qversion.parse(path.join(__dirname, 'ref'));

// 设置模板引擎
qtemplate(app, {
    views: __dirname + "/views", // 总模板目录
    layouts: 'layouts', // layout模板目录，默认views/layouts
    versions: qversion.versions()
});

exception.init(logger);
// 捕获异步异常，放到所有中间件前面
app.use(exception.catchAsync());

app.use(favicon(__dirname + '/favicon.ico'));
app.enable('trust proxy');

// 日志处理
var loggerConfig = config.logger;
if (loggerConfig && loggerConfig.logFiles) {
    loggerConfig.logFiles.forEach(function(item) {
        app.use(item.route, logger.connectLogger(item.type));
    });
}
app.use(logger.connectLogger());

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(compression());
app.use(function(req, res, next) {
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Expires', '0');
    res.setHeader('X-Powered-By', 'QXF');
    next();
});

// healthcheck 发布时有用，放到所有路由之前
healthcheck.check(app, path.join(__dirname, 'healthcheck.html'));

// 路由规则
app.use('/', routes);

// 捕获同步异常，放到所有中间件后面
app.use(exception.catchSync());

module.exports = app;
