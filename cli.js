
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