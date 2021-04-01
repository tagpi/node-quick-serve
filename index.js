const { Client } = require('./client.js');
require('colors');

exports.serve = async config => {
  const client = new Client(config);
  await client.init(config);
  return client;
}



