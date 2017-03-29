/**
 * modA
 */

var bigape = require('../../../../src')

var pl = bigape.createPagelet({
	name: 'modA',

	domID: 'modA',

	template: 'mod.njk',

	getService() {
		return {
			status: 200,
			message: 'this is modA'
		}
	}
})

module.exports = pl;
