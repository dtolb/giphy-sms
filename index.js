const Bandwidth = require('node-bandwidth');
const bodyParser = require('body-parser');
const debug = require('debug')('my-namespace');
const name = 'giphy_sms';
debug('booting %s', name);

const express = require('express');

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

let isIncomingGroupMessage = function (message) {
	let isDirectionIn = (message && message.message && message.message.direction == 'in');
	debug('Message is direction "in": %s', isDirectionIn);
	return isDirectionIn;
};

let hasCommand = function (message) {
	return message.text.toLowerCase().startsWith('@gif');
};

let searchGifResponse = function (gifs) {
	if (!gifs.data) {
		throw new Error('No data in gif response');
	}
	let gifUrl = '';
	gifSearch:
	for (let i = 0; i < gifs.data.length; i++) {
		let gif = gifs.data[i]
		for (key in gif.images) {
			let pict = gif.images[key];
			debug('Gif Size: %s', pict.size);
			if (pict.size < maxGifSize) {
				gifUrl = pict.url;
				debug('Found Gif!: ', gifUrl)
				break gifSearch;
			}
		}
	}
	debug('Gif Url: %s', gifUrl);
	return gifUrl;
}

let buildMessage = function (message, gifUrl) {
	let text = '';
	let outMessage = {
		from: message.to
	}
	if (gifUrl === '') {
		text = 'No Gif Found';
	}
	else {
		outMessage.media = [gifUrl]
	}
	outMessage.text = text;
	let toNumbers = message.message.to;
	let index = toNumbers.indexOf(message.to);
	if (index > -1 ) {
		toNumbers.splice(index, 1);
	}
	toNumbers.push(message.message.from);
	outMessage.to = toNumbers;
	debug(outMessage);
	return outMessage;
}

let findGif = function (message) {
	let phrase = message.text.replace('@gif', '');
	return giphy.search(phrase);
};

let app = express();
app.use(bodyParser.json());

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

const port = process.env.PORT || 3000;

app.listen(port, process.env.HOST || "0.0.0.0");
console.log("Gif bot running on port: ", port);

