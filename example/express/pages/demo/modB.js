/**
 * modB
 */

// var bigape = require('bigape')
var bigape = require('../../../../src')

var pl = bigape.createPagelet({
  name: 'modB',

  domID: 'modB',

  template: 'mod.njk',

  getService() {
    return new Promise(function(resolve, reject) {
      setTimeout(function() {
        resolve({
          status: 200,
          message: 'this is modB'
        })
      }, 100)
    })
  }
})

module.exports = pl;
