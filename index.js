const path = require('path');
const fs = require('fs-extra');
const { get } = require('lodash');
require('colors');


exports.start = async config => {

  const app = require('express')();
  const http = require('http').createServer(app);

  //
  startSocketServer(http, config);
  startHttpServer(app, config);

  // start http server
  const port = get(config, 'http.port') || 8080;
  http.listen(port, () => {
    console.log(`http server started on ${port}`);
  });

}


// socket
function startSocketServer(http, config) {
  
  const enabled = get(config, 'http.enabled') || true;
  if (!enabled) { return false }
  
  const api = get(config, 'socket.api');
  const connect = get(api, 'connection.connect');
  const disconnect = get(api, 'connection.disconnect');
  api.server = {
    ping() { 
      return Date.now();
    }
  }

  const io = require('socket.io')(http);
  io.on('connection', (socket) => {

    if (connect) { 
      connect(socket);
    }

    socket.on('disconnect', () => {
      if (disconnect) { 
        disconnect(socket);
      }
    });

    socket.on('@', async packet => {

      const parts = packet['@'].split('.');
      const method = parts.pop();
      const target = get(api, parts.join('.'));
      
      try {
        
        if (!target) { throw `unknown library [${parts.join('.')}]` }
        if (!target[method]) { throw `unknown action [${packet['@']}]` }

        const fn = target[method].bind(target);

        const data = await fn(socket, packet);
        const reply = {
          id: packet.$id,
          ok: 1,
          data: data
        }
        socket.emit('~', reply)

      } catch (ex) {

        console.log('error:'.red, packet['@'], ex);
        socket.emit('~', { 
          id: packet.$id, 
          error: ex.message || ex.toString()
        });

      }
    });

  });

}


// http
function startHttpServer(app, config) {

  const enabled = get(config, 'http.enabled') || true;
  if (!enabled) { return false }

  const folders = get(config, 'http.path') || { '/': 'public' };
  const defaultFile = getServePath(get(config, 'http.default') || `${folders['/']}/index.html`);

  // init server
  app.use(function(req, res, next) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    next();
  });

  // client files
  const clientKey = get(config, 'http.client') || '/node/quick-serve';
  folders[clientKey] = path.join(__dirname, './public');
  
  // serve files
  const keys = Object.keys(folders);
  keys.sort((a, b) => a.split('/').length > b.split('/').length ? -1 : 1);

  for(let key of keys) {
    const folder = folders[key];
    const source = getServePath(folder);
    app.get(`${key}*`, (req, res) => {
      let fullPath = path.join(source, req.originalUrl.substr(key.length) || '/');
      if (!fs.existsSync(fullPath)) {
        fullPath = defaultFile;
        console.log('file not found', req.originalUrl, key);
      }
      res.sendFile(fullPath);
    });
  }

}

function getServePath(folder) { 
  if (folder.substr(0, 1) !== '/') {
    folder = path.join(process.cwd(), folder);
  } 
  return folder;
}
