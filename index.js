const Bandwidth = require('node-bandwidth');
const bodyParser = require('body-parser');
const debug = require('debug')('my-namespace');
const name = 'giphy_sms';
debug('booting %s', name);

const express = require('express');
let app = express();
const maxGifSize = 1500000;

const userId = process.env.CATAPULT_USER_ID;
const apiToken = process.env.CATAPULT_API_TOKEN;
const apiSecret = process.env.CATAPULT_API_SECRET;
let giphy = require('giphy-api')();

if (!userId || !apiToken || !apiSecret ) {
  throw new Error('Invalid or non-existing Bandwidth credentials. \Please set your: \n * userId \n * apiToken \n * apiSecret');
}

const api = new Bandwidth({
  userId    : userId,
  apiToken  : apiToken,
  apiSecret : apiSecret
});


let processGroupMessage = function (message) {
	debug('Processing Group message');
	return findGif(message.message)
	.then(searchGifResponse)
	.then(gifUrl => {
		let outMessage = buildMessage(message, gifUrl);
		return api.Message.sendGroup(outMessage);
	})
	.then(res=> {
		debug(res);
	});
};

app.post('/message', (req, res) => {
	res.sendStatus(200);
	debug('Incoming Request: \n')
	debug(req.body);
	debug(req.body[0].message.to);
	if(Array.isArray(req.body)){
		debug('Incoming Message is Array');
		req.body.forEach(message=> {
			debug('Iterating over message');
			if (isIncomingGroupMessage(message)) {
				if (hasCommand(message.message)){
					processGroupMessage(message)
					.then(function () {
						debug('done');
					})
					.catch(err=> {
						console.log(err);
					})
				}
				else {
					debug('No command');
				}
			}
		})
	}
	else {
		debug('Not array');
	}
});


function startServer() {
	debug('Starting Server');
	app.use(bodyParser.json());
	app.use('/callback/', require('./routes.js'));

	/// catch 404 and forward to error handler
	app.use(function (req, res, next) {
		var err = new Error('not found');
		err.status = 404;
		next(err);
	});

	// production error handler, no stacktraces leaked to user
	app.use(function (err, req, res, next) {
		logger.error(sprintf(
			'error status=%s message=%s',
			err.status, err.message
		));
		logger.error(err.stack);
		res.status(err.status || 500);

		if (typeof(err.status) === 'undefined') {
			res.send({
				status: 'error',
				error: 'service error'
			});
		} else {
			res.send({
				status: 'error',
				error: err.message
			});
		}
	});

	const port = process.env.PORT || 3000;
	app.listen(port, process.env.HOST || "0.0.0.0", function () {
		console.log('Group Messaging Bot listening on port ' + config.server.port);
	});
}

startServer()
