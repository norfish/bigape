/**
 * @desc: promise
 * @authors: yongxiang.li
 * @date: 2016-11-01 12:48:17
 */

var p1 = function(){
    return new Promise(function(resolve, reject) {
        setTimeout(function() {
            resolve('p1');
        },10)
    })
};

var p2 = function(){
    return new Promise(function(resolve, reject) {
        setTimeout(function() {
            reject('p2');
        },10)
    })
};


var p3 = function(){
    return new Promise(function(resolve, reject) {
        setTimeout(function() {
            resolve('p3');
        },10)
    })
};

var p4 = function() {
    return 'ppp4 function';
}

var p5 = {
    name: 'tt',
    then: function(resolvePromise, rejectPromise) {
        console.log('excute then', resolvePromise)
        rejectPromise('then')
        return 'then'
    }
}

// 顺序执行
// 在onfullfilled 如果异常，会进入next catch，如果没有nextcatch，会进入next reject，如果都没有会静默报错
// 链ui同理
// 如果resolve或者reject没有被上层的函数执行，那么传递给下级的then继续执行，如果已经被处理，则之后的then会onFulled


p1().then(function(data) {
    // throw 'e'
    console.log('p1-data', data);
    return p5;
}).then(function(data) {
    console.log('p2-data', data);
    return p3();
}, function(err) {
    console.log('rej-p2', err);
}).catch(function(err) {
    console.log('catch', err);
});
//
// p1().then(function(data) {
//     console.log('res1', data);
//     return data;
// }).then(function(data) {
//     console.log('res2', data);
//     return data;
// }, function(data) {
//     console.log('rej2', data);
//     return data;
// }).catch(function(e) {
//     console.log('err', e)
// })
