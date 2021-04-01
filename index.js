const { Client } = require('./client.js');
require('colors');

exports.serve = async config => {
  const client = new Client(config);
  await client.init(config);
  return client;
}


// NPX commands 
if (process.cwd() !== __dirname) { 
  console.log(process.cwd(), '!==', __dirname)
  return 
}


const command = process.argv[2];
switch (command) {

  case 'start':
    let configParam = process.argv[3];
    exports.serve(configParam);
    break;

  default:
    console.log('[@tagpi/node-quick-serve]'.yellow, 'invalid command'.red);
    break;

}
