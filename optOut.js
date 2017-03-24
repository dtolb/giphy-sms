const debug = require('debug')('giphy_sms');
const mongoose = require('mongoose');
const import findOrCreate from 'findorcreate-promise';
const Promise = require('bluebird');

mongoose.Promise = global.Promise;
mongoose.connect(process.env.DATABASE_URL || process.env.MONGODB_URI || 'mongodb://localhost/giphy-sms');

const NumberSchema = new mongoose.Schema({
	number: { type: String, required: true},
	disable: {type: Boolean, default: true}
});

NumberSchema.plugin(findOrCreate);

const Number = mongoose.model('Number', NumberSchema);

const phrases = [
	'stop',
	'unsubscribe'
];

const addNumberToOptOut = function (number) {
	// let numberToAdd = new Number({
	// 	number: number,
	// 	disable: true
	// });
	return Number.findOrCreate({
		number: number
	});
}

const searchForNumber = function (number) {
	return Number.find({ number: number})
	.then(function (res) {

	})
}

module.exports.removeOptOutsFromMessage = function (req, res, next) {
	const outNumbers = req.outMessages[0].to;
	outNumbers.map()
	return Promise.map(outNumbers, function (number) {
		return Number.find({ number: number });
		.then(function (doc) {
			return doc.number;
		})
	})
	.then(function (results) {
		return outNumbers.filter(function (el) {
			return results.indexOf(el) < 0;
		});
	})
	.catch(function (err) {
		debug('Error removing components from to array');
		next(err);
	})
})

module.exports.checkForOptOut = function (req, res, next) {
	let message = req.body[0];
	let number = message.message.from;
	let text = message.message.text.toLowerCase();
	if (phrases.indexOf(text) < 0) {
		addNumberToOptOut(number)
		.then(function (doc) {
			if (doc.created) {
				debug('Added number to block list: ' + number);
			}
			else {
				debug('Number already in block list: ' + number);
			}
			next();
		})
		.catch(function (err) {
			debug('Error finding or creating number to block list: ' + number);
		})
	}
};