/**
 * modB
 */

var bigape = require('../../../../src')

var pl = bigape.createPagelet({
	name: 'modB',

	domID: 'modB',

	template: 'mod.njk',

	getService() {
		return {
			status: 200,
			message: 'this is modB'
		}
	}
})

module.exports = pl;
