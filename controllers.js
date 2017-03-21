const commands = require('commands.js');

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
	debug('Message is direction "in": %s', isDirectionIn);
	if (isIncomingMessage) {
		return message.text.toLowerCase().startsWith('@');
	}
};

const extractCommand = function (message) {
	let text = message.text.toLowerCase().substr(1);
	let command = text.split(' ')[0];
	let query = text.replace(command, '').trim();
	return { command: command, query: query};
};

const messageHandler = function (message) {}
module.exports.checkIfBodyIsArray = function (req, res, next) {
	if(Array.isArray(req.body)){
		next();
	}
	else {
		var e = new Error('Message body not array');
		debug(e);
		next(e);
	}
};

module.exports.handleMessages = function (req, res, next) {
	req.outMessage = [];
	message = req.body[0];
	debug('Handling message');
	if (messageReadyForProcessing(message)) {
		message.numbers = buildToArray(message);
		message.command = extractCommand(message);
		if (isCommandValid(command.command)) {
			commands[command](message)
			.then(function (outMessage) {
				req.outMessages.push(outMessage);
			})
			.catch(function (error) {
				debug(error);
				req.outMessages.push(commands.error(message));
			})
			.finally(function () {
				next()
			});
		}
		else {
			req.outMessages.push(commands.default(message));
			next();
		}
	}
};

module.exports.sendMessages = function (req, res, next) {};

