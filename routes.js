const express = require('express');
let router = module.exports = express.Router();
const controllers = require('./controllers.js');

router.route('/message')
	.post(
		controllers.checkIfBodyIsArray,
		controllers.handleMessages,
		controllers.sendMessages
		);

router.route('/calls')