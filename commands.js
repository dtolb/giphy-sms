const gif = require('./gif.js');
const weather = require('./weather.js');
const bandi = require('./bandi.js');
const catfact = require('./catfact.js');
const Promise = require('bluebird');

const noCommand = function (message) {
	return Promise.resolve({
		text: 'Sorry, I don\'t know: ' + message.command.command,
		to: message.numbers.to,
		from: message.numbers.from
	});
};

const commandError = function (message) {
	return Promise.resolve({
		text: 'Sorry, something went wrong',
		to: message.numbers.to,
		from: message.numbers.from
	});
}

module.exports = {
	gif: gif.handleGifCommand,
	weather: weather.handleWeatherCommand,
	error: commandError,
	default: noCommand,
	bandi: bandi.handleBandiCommand,
	catfact: catfact.handleCatFactCommand
}
