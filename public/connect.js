import './socket.io.js'

class Connect extends EventTarget {

  constructor(address) {
    super();

    this.tracker = 0;
    this.packet = {};
    this.socket = io(address);
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

export const connect = async address => {
  return new Connect(address);
}