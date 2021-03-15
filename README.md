# node-quick-serve

Basic application with a server

## USAGE 

Server:
```
const { serve } = require('@tagpi/quick-serve');
(async () => {

  // start the server
  const server = await serve({ 

    // default http entries
    http: {
      port: 8080,
      path: {
        '/': './public',
      },
      default: '/index.html'
    },

    // default client api
    api: {
      connection: { 
        connect(socket, param) { 
          console.log('cn')
        },
        disconnect(socket, param) {
          console.log('dc')
        }
      },
      server: {
        ping() { 
          return Date.now();
        }
      }
    }

  });
})()
```

Client:
```
<script>
  import { connect } from './node/quick-serve/connect.js';
  (async () => {

    // server to client commands
    const serverToClientApi = { 
      sys: { 
        log(param) { 
          console.log('[api.sys]', param.message);
        }
      }
    }

    // 
    const client = await connect(serverToClientApi);
    console.log(await client.server.ping());
    
  })()
</script>
```

