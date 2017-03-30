/**
 * modA
 */

// var bigape = require('bigape')
var bigape = require('../../../../src')

var pl = bigape.createPagelet({
	name: 'modA',

	domID: 'modA',

	template: 'mod.njk',

	getService() {
		return new Promise(function(resolve, reject) {
			setTimeout(function() {
				resolve({
					status: 200,
					message: 'this is modA'
				})
			}, 500)
		})
	}
})

module.exports = pl;
