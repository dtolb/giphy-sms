const commands = require('./commands.js');
const debug = require('debug')('giphy_sms');
const bandwidth = require('./bandwidth');
const transferToNumber = '+18446550429'

const buildToArray = function (message) {
	let numbers = {
		from: message.to
	}
	let toNumbers = message.message.to;
	let index = toNumbers.indexOf(message.to);
	if (index > -1 ) {
		toNumbers.splice(index, 1);
	}
	toNumbers.push(message.message.from);
	numbers.to = toNumbers;
	return numbers;
}

const isCommandValid = function (command) {
	// check to see if function as well
	return commands.hasOwnProperty(command);
};

const messageReadyForProcessing = function (message) {
	let isIncomingMessage = (message && message.message && message.message.direction == 'in');
	debug('Message is direction \'in\': %s', isIncomingMessage);
	if (isIncomingMessage) {
		debug(message);
		return message.message.text.toLowerCase().startsWith('@');
	}
	else {
		return false;
	}
};

const extractCommand = function (message) {
	let text = message.message.text.toLowerCase().substr(1);
	let command = text.split(' ')[0];
	let query = text.replace(command, '').trim();
	return { command: command, query: query};
};

const speakFailureToCall = function (callId) {
	const sentence = 'Sorry, Bandwidth is not available right now. Please try again later';
	return bandwidth.Call.speakSentence(callId, sentence);
}

module.exports.checkIfBodyIsArray = function (req, res, next) {
	debug('Checking if body is array ')
	if(Array.isArray(req.body)){
		debug('Req body is array');
		next();
	}
	else {
		var e = new Error('Message body not array');
		debug(e);
		next(e);
	}
};

module.exports.handleMessages = function (req, res, next) {
	req.outMessages = [];
	let message = req.body[0];
	debug('Handling message');
	if (messageReadyForProcessing(message)) {
		message.numbers = buildToArray(message);
		message.command = extractCommand(message);
		const command = message.command.command
		if (isCommandValid(command)) {
			commands[command](message)
			.then(function (outMessage) {
				debug(outMessage);
				req.outMessages.push(outMessage);
			})
			.catch(function (error) {
				debug('Error generating message');
				debug(error);
				req.outMessages.push(commands.error(message));
			})
			.then(function () {
				next();
			});
		}
		else {
			debug('No command found');
			req.outMessages.push(commands.default(message));
			next();
		}
	}
	else {
		var e = 'Message contents not valid';
		debug(e);
	}
};

module.exports.sendMessages = function (req, res, next) {
	bandwidth.Message.sendGroup(req.outMessages[0])
	.then(function (body) {
		debug(body);
	})
	.catch(function (err) {
		debug('Error sending message');
		next(err);
	});
};

module.exports.sendAccepted = function (req, res, next) {
	res.sendStatus(201);
	next();
}

module.exports.checkCallEventType = function (req, res, next) {
	let eventType = '';
	try {
		debug('Incoming call from: ' + req.body.from);
		debug('Incoming call Id: ' + req.body.callId);
		eventType = req.body.eventType;
		if (eventType === 'answer'){
			next();
		}
		else {
			var e = 'Not answer event';
			next(e);
		}
	}
	catch (e) {
		debug(e);
		next(e);
	}
}

module.exports.transferCallToSales = function (req, res, next) {
	const transferPayLoad = {
		transferTo       : transferToNumber,
		whisperAudio     : {
			sentence : 'Incoming call from group m m s page!',
			gender   : 'female',
			voice    : 'Kate',
			locale   : 'en'
		}
	};
	bandwidth.Call.transfer(req.body.callId, transferPayLoad)
	.then(function (call) {
		debug('Created call with id: ' + call.id);
		req.outboundCallId = call.id;
		//next();
	})
	.catch(function (err) {
		debug('Error creating call');
		debug(err);
		return speakFailureToCall(req.body.callId)
		.then(function () {
			next(err);
		})
		.catch(function (err) {
			debug('Error speaking to call');
			next(err);
		});
	});

}

