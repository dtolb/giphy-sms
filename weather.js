const DarkSky = require('dark-sky')
const forecast = new DarkSky(process.env.DARKSKY_KEY);
const debug = require('debug')('giphy_sms');
let Promise = require('bluebird');

let googleMapsClient = require('@google/maps').createClient({
  key: process.env.GOOGLE_KEY
});

let geoCode = Promise.promisify(googleMapsClient.geocode);

String.prototype.lowerCaseFirstLetter = function() {
    return this.charAt(0).toLowerCase() + this.slice(1);
}

const noAddress = function (message) {
	return {
		text: 'Can\'t find weather information for: ' + message.command.query,
		to: message.numbers.to,
		from: message.numbers.from
	};
}

module.exports.handleWeatherCommand = function (message) {
	return geoCode({
		address: message.command.query
	})
	.then(function (data) {
		let bounds;
		try {
			bounds = data.json.results[0].geometry.location
		}
		catch (e) {
			debug(e);
			throw new Error('Can\'t find results');
		}
		debug(bounds);
		return bounds;
	})
	.then(function (bounds) {
		return forecast
			.latitude(bounds.lat)
			.longitude(bounds.lng)
			.get()
			.then(function (res) {
				let txt = 'Weather for ' + message.command.query + ' is ';
				try {
					let hourly = res.hourly.summary.lowerCaseFirstLetter();
					let daily = res.daily.summary.lowerCaseFirstLetter();
					txt = txt + hourly + ' And expect ' + daily;
					return {
						text: txt,
						to: message.numbers.to,
						from: message.numbers.from
					}
				}
				catch (e) {
					debug(e);
					throw new Error('Can\'t find results');

				}
			});
	})
	.catch(function (err) {
		debug(err);
		return noAddress(message);
	});
}
