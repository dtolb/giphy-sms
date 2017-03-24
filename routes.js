const express = require('express');
let router = module.exports = express.Router();
const controllers = require('./controllers.js');

router.route('/message')
	.post(
		controllers.sendAccepted,
		controllers.checkIfBodyIsArray,
		controllers.handleMessages,
		controllers.sendMessages
		);

router.route('/calls')
	.post(
		controllers.sendAccepted,
		controllers.checkCallEventType,
		controllers.transferCallToSales
		);