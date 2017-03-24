const debug = require('debug')('giphy_sms');

module.exports.handleBandiCommand = function (message) {
	const helpText = 'Hey there! I\'m Bandi! You can trigger me by starting your message with an "@" symbol\n'+
		'Right now I support the following commands: \n'+
		'* "@gif search-phrase": @gif dog fail\n' +
		'* "@weather location": @weather Raleigh\n';
	return Promise.resolve({
		text: helpText,
		to: message.numbers.to,
		from: message.numbers.from
	});
}