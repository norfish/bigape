/**
 * modC
 */

// var bigape = require('bigape')
var bigape = require('../../../../src')

var pl = bigape.createPagelet({
  name: 'modC',

  domID: 'modC',

  template: 'mod.njk',

  getService() {
    return new Promise(function(resolve, reject) {
      setTimeout(function() {
        resolve({
          status: 200,
          message: 'this is modC'
        })
      }, 1000)
    })
  }
})

module.exports = pl;
