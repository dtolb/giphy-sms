const Bandwidth = require('node-bandwidth');

const userId = process.env.CATAPULT_USER_ID;
const apiToken = process.env.CATAPULT_API_TOKEN;
const apiSecret = process.env.CATAPULT_API_SECRET;

if (!userId || !apiToken || !apiSecret ) {
  throw new Error('Invalid or non-existing Bandwidth credentials. \Please set your: \n * userId \n * apiToken \n * apiSecret');
}

const api = new Bandwidth({
  userId    : userId,
  apiToken  : apiToken,
  apiSecret : apiSecret
});

module.exports.sendMessage()