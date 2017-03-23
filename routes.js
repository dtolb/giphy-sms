const express = require('express');
let router = module.exports = express.Router();
const controllers = require('./controllers.js');

router.route('/message')
	.post(
		function (req, res, next) {
			res.send(201);
			next();
		},
		controllers.checkIfBodyIsArray,
		controllers.handleMessages,
		controllers.sendMessages
		);

router.route('/calls')