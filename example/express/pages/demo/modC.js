/**
 * modC
 */

var bigape = require('../../../../src')

var pl = bigape.createPagelet({
	name: 'modC',

	domID: 'modC',

	template: 'mod.njk',

	getService() {
		return {
			status: 200,
			message: 'this is modC'
		}
	}
})

module.exports = pl;
