const path = require('path');
const fs = require('fs-extra');
const { get } = require('lodash');
require('colors');


exports.serve = async config => {
  const client = new Client(config);
  await client.init(config);
  return client;
}

class Client {

  tracker = 0;
  packet = {};

  async init(config) {
    const app = require('express')();
    const http = require('http').createServer(app);

    //
    this.startSocketServer(http, config);
    this.startHttpServer(app, config);

    // start http server
    const port = get(config, 'http.port') || 8080;
    http.listen(port, () => {
      console.log(`http server started on ${port}`);
    });

  }

  // socket
  startSocketServer(http, config) {
  
    const enabled = get(config, 'http.enabled') || true;
    if (!enabled) { return false }
    
    // api setup
    const api = get(config, 'api');
    const connect = get(api, 'connection.connect');
    const disconnect = get(api, 'connection.disconnect');
    api.server = {
      ping() { 
        return Date.now();
      }
    }

    // socket setup
    this.io = require('socket.io')(http);
    this.io.on('connection', (socket) => {

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

      socket.on('~', reply => {
        const packet = this.packet[reply.id];
        if (packet) {
          delete this.packet[reply.id];
          if (reply.error) {
            // console.error(`error: [${packet['@']}]`, reply.error);
            return packet && packet.n(`[api] ${reply.error}`);
          }
          // delete reply.$id;
          packet.y(reply.data);
        } 
      })

    });

  }
  
  async send(socket, action, param){
    return await new Promise((y, n) => {

      const packet = {
        '@': action, 
        $id: `@${++this.tracker}`,
        y, 
        n,
        ...param,
      };

      this.packet[packet.$id] = packet;
      socket.emit('@', packet);

    });
  }

  async broadcast(action, param){
    const packet = {
      '@': action, 
      ...param,
    };
    this.io.local.emit('@', packet);
  }

  // http
  startHttpServer(app, config) {

    const enabled = get(config, 'http.enabled') || true;
    if (!enabled) { return false }

    const folders = get(config, 'http.path') || { '/': 'public' };
    const defaultFile = this.getServePath(get(config, 'http.default') || `${folders['/']}/index.html`);

    // init server
    app.use((req, res, next) => {
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
      const source = this.getServePath(folder);
      app.get(`${key}*`, (req, res, next) => {
        let fullPath = path.join(source, req.originalUrl.substr(key.length) || '/');
        if (!fs.existsSync(fullPath)) {
          fullPath = defaultFile;
          console.log('file not found', req.originalUrl, key);
        }
        res.sendFile(fullPath);
      });
    }

  }

  getServePath(folder) { 
    if (folder.substr(0, 1) !== '/') {
      folder = path.join(process.cwd(), folder);
    } 
    return folder;
  }



}



