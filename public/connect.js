import './socket.io.js'

class Connect extends EventTarget {

  constructor(api) {
    super();

    this.api = api;
    this.tracker = 0;
    this.packet = {};
    this.socket = io();
    this.connected = false;

    this.socket.on('connect', async () => {
      this.connected = true;
      this.dispatchEvent(new CustomEvent('connected'));
    })

    this.socket.on('disconnect', () => {
      this.connected = false;
      this.dispatchEvent(new CustomEvent('disconnected'));
    })

    this.socket.on('~', reply => {
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

    this.socket.on('@', async packet => {

      const parts = packet['@'].split('.');
      const method = parts.pop();
      let target = this.api;
      for (let part of parts) {
        if (!target) { break }
        target = target[part];
      }
      
      try {
        
        if (!target) { throw `unknown library [${parts.join('.')}]` }
        if (!target[method]) { throw `unknown action [${packet['@']}]` }

        const fn = target[method].bind(target);
        const data = await fn(packet);
        if (packet.$id) {
          const reply = {
            id: packet.$id,
            ok: 1,
            data: data
          }
          this.socket.emit('~', reply)
        }

      } catch (ex) {

        console.error('error:', packet['@'], ex);
        if (packet.$id) {
          this.socket.emit('~', { 
            id: packet.$id, 
            error: ex.message || ex.toString()
          });
        }

      }
    });


  }

  async send(action, param){
    return await new Promise((y, n) => {

      const packet = {
        '@': action, 
        $id: `@${++this.tracker}`,
        y, 
        n,
        ...param,
      };

      this.packet[packet.$id] = packet;
      this.socket.emit('@', packet);

    });
  }

}

export const connect = async (api) => {
  return new Connect(api);
}