const debug = require('debug')('giphy_sms');
const mongoose = require('mongoose');
const findOrCreate = require('findorcreate-promise');
const Promise = require('bluebird');
const _ = require('underscore');

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
	debug('Adding number to optout list: ' + number);
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
	debug('Searching for optouts: ' + outNumbers);
	return Promise.map(outNumbers, function (number) {
		return Number.find({ number: number })
		.then(function (doc) {
			if (doc.length > 0) {
				debug('Found number in optout: ' + doc[0].number);
				return doc[0].number;
			}
			else {
				debug('Number not in opt out list: ' + number);
			}
		})
	})
	.then(function (results) {
		debug('Numbers that opted out: ' + results);
		req.outMessages[0].to = _.difference(outNumbers,results);
		next();
	})
	.catch(function (err) {
		debug('Error removing components from to array');
		next(err);
	})
};

module.exports.checkForOptOut = function (req, res, next) {
	let message = req.body[0];
	let number = message.message.from;
	let text = ''
	try {
		text = message.message.text.toLowerCase();
	}
	catch (e) {
		debug('No text in message')
		next();
		return;
	}
	debug('Incoming text: ' + text);
	if (phrases.indexOf(text) >= 0) {
		debug('Stop Command Found');
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
	else {
		debug('Not a stop command');
		next();
	}
};