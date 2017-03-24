const debug = require('debug')('giphy_sms');
const catFacts = require('cat-facts');

module.exports.handleCatFactCommand = function (message) {
	const catFact = catFacts.random();
	return Promise.resolve({
		text: catFact,
		to: message.numbers.to,
		from: message.numbers.from
	});
};