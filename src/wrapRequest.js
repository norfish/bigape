var logger = require('@qnpm/q-logger');
var debug = require('debug')('bigape:service');
var request = require('request');
var q = require('q');
var _ = require('lodash');
var qs = require('qs');

/**
 *
 * @param {String}          url 发送请求url
 * @param {Object}          options
 * @param {Object|String}   options.data  发送数据
 * @param {String}          [options.qmonitor]  watcher监控key
 *                                              自动监控接口响应时间 访问次数 和 错误次数
 *                                              错误次数的key为key_error
 * @param {String}          [options.method="GET"] http请求方式
 * @param {String}          [options.responseDataType="json"] 服务器返回数据类型
 * @param {String}          [options.postType="urlencoded"]  post时发送的数据类型 method为post时 此字段有效
 * @param {Integer}         [options.timeout=5000]  超时时间 单位 毫秒
 * @param {Function}        [options.jsonValid = function(data){return Boolean;}] 自定义 json 响应数据的预判断逻辑
 *                                             									数据正确返回 true
 *                                             									默认根据 status 或 ret 判断
 */
function qRequest(url, options) {

    var options = getOptions(url, options);

    var qmonitorKey = options.qmonitor;

    var qmonitorErrKey = qmonitorKey + '_error';

    var deferred = q.defer();

    var startTime = Date.now();

    var convertedOptions = convertOptions(options);

    request(convertedOptions, function(err, response, body) {

        // qmonitor.addCount(qmonitorKey);

        var errMesssage = checkError(err, response, body);

        if (options.responseDataType === 'json') {
            var res = parseJSONStr(errMesssage, body);
            body = res.data;
            if (res.parseErr) {
                // qmonitor.addCount(qmonitorErrKey);
                deferred.reject(body);
                return deferred.promise;
            }
        }

        if (errMesssage) {
            // qmonitor.addCount(qmonitorErrKey);
            logForFailure(options, errMesssage);
            deferred.reject(body);
        } else {

            // qmonitor.addTime(qmonitorKey, Date.now() - startTime);

            if ( options.responseDataType === 'json' && !options.jsonValid(body) ) {
                logForSuccess(options, body);
                // qmonitor.addCount(qmonitorErrKey);
                debug('后端接口数据异常 ' + '返回数据:' + JSON.stringify(body) +
                    ' 请求参数:' + JSON.stringify(options));
                deferred.reject(body);
            } else {
                logForSuccess(options, body);
                deferred.resolve(body);
            }
        }
    });

    return deferred.promise;
}

/**
 * 校验响应的 json 数据是否为成功
 *
 * @param  {Object} body  响应数据
 * @return {Boolean}      检验结果 成功|true
 */
var jsonValid = function(json) {
    var ret = typeof json.status !== 'undefined' && json.status == 0 ||
                typeof json.ret !== 'undefined' && json.ret != true;

    return ret;
};

var DEFAULT_OPTIONS  = {
    method: 'GET',
    responseDataType: 'json',
    timeout: 5000,
    jsonValid: jsonValid
};

var POST_DEFAULT_OPTIONS = {
    postType: 'urlencoded'
};

var OPTION_KEYS = {
    data: 1,
    qmonitor: 1,
    method: 1,
    responseDataType: 1,
    postType: 1,
    proxy: 1,
    timeout: 1,
    headers: 1,
    jsonValid: 1
};

var parseJSONStr = (function() {

    var jsonFailure = {
        status: 1,
        message: '服务器繁忙，请稍后再试'
    };

    return function(err, jsonStr) {

        var json = null;
        var parseErr = false;

        if (err) {
            json = jsonFailure;
        } else {
            try {
                json = JSON.parse(jsonStr);
            } catch (e) {
                debug('解析json字符串失败\n' + jsonStr);
                parseErr = true;
                json = jsonFailure;
            }
        }

        return {
            parseErr: parseErr,
            data: json
        };
    }
})();

function getOptions(url, originalOptions) {

    var opt = _.extend({
            url: url
        }, DEFAULT_OPTIONS, originalOptions.method === 'POST' ? POST_DEFAULT_OPTIONS : {},
        _.pick(originalOptions, function(value, key, object) {
            return OPTION_KEYS.hasOwnProperty(key);
        }));

    //console.log('===opt===');
    //console.log(opt);
    return opt;
}

function convertOptions(options) {

    var opt = {
        url: options.url,
        method: options.method,
        timeout: options.timeout
    };

    if (options.proxy) {
        opt.proxy = options.proxy;
    }

    if (options.headers) {
        opt.headers =  options.headers;
    }

    if (options.method === 'GET') {
        opt.qs = typeof options.data === 'string' ? qs.parse(options.data) : options.data;
    } else if (options.method === 'POST') {

        if (options.postType === 'urlencoded') {
            opt.form = typeof options.data === 'string' ? options.data : qs.stringify(options.data);
        } else if (options.postType === 'json') {
            opt.body = JSON.stringify(options.data);

            if (opt.headers) {
                opt.headers['Content-type'] = 'application/json';
            } else {
                opt.headers = {
                    'Content-type': 'application/json'
                };
            }
        }
    }


    //console.log('转换后options');
    //console.log(opt);

    //todo output debug info

    return opt;
}

function logForFailure(requestOptions, errroMessage) {
    debug('http请求失败:' + errroMessage + '  请求参数:' + JSON.stringify(requestOptions));
}

function logForSuccess(requestOptions, data) {
    debug('http请求成功: 请求参数:' + JSON.stringify(requestOptions) + '  返回数据:' + JSON.stringify(data));
}

function checkError(err, response, body) {

    if (err) {
        //DNS resolution, TCP level errors, timeout, or actual HTTP parse errors
        return '错误:' + err.message;
    }

    if (response.statusCode < 200 || response.statusCode >= 300) {
        //404 500
        return 'http状态码:' + response.statusCode + '  响应实体:' + body;
    }

    if (!body) {
        return '错误:响应实体为空';
    }
}

module.exports = qRequest;


/*
 failure
 DNS resolution, TCP level errors, timeout, or actual HTTP parse errors
 404 500

 call reject

 * get
 *  parameter querystring
 *  response json
 *
 *
 * post
 *  posttype
 *      urlencoded  content-type  aplication/x-www/form
 *      json  content-type  application/json
 *
 * json
 failure

 call reject

 statua !== 0
 call reject
 */
