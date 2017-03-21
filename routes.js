const express = require('express');
let router = module.exports = express.Router();
const controllers = require('./controllers.js');

router.route('/message')
	.post(
		controllers.checkIfBodyIsArray,
		controllers.determineAction,
		controllers.buildResponse,
		controllers.sendMessage
		);

router.route('/calls')