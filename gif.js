let giphy = require('giphy-api')();
const debug = require('debug')('giphy_sms');
const maxGifSize = 1500000;

module.exports.handleGifCommand = function (message) {
	return giphy.search(message.command.query)
		.then(searchGifResponse)
		.then(function (gifUrl) {
			return {
				media: [gifUrl],
				to: message.numbers.to,
				from: message.numbers.from
			}
		})
		.catch(function (error) {
			debug(error);
			return {
				text: 'Can\'t find gif for: ' + message.command.query,
				to: message.numbers.to,
				from: message.numbers.from
			};
		});
};

const searchGifResponse = function (gifs) {
	if (!gifs.data) {
		throw new Error('No data in gif response');
	}
	let gifUrl = '';
	gifSearch:
	for (let i = 0; i < gifs.data.length; i++) {
		let gif = gifs.data[i]
		for (key in gif.images) {
			let pict = gif.images[key];
			debug('Gif Size: %s', pict.size);
			if (pict.size < maxGifSize) {
				gifUrl = pict.url;
				debug('Found Gif!: ', gifUrl)
				break gifSearch;
			}
		}
	}
	debug('Gif Url: %s', gifUrl);
	return gifUrl;
}