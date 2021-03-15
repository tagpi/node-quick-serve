# node-quick-serve

Basic application with a server

## USAGE 

Server:
```
require('quick-serve').start()
```

Client:
```
<script>
  import { connect } from './node/quick-serve/connect.js';

  (async () => {
    const client = await connect();
    console.log(await client.server.ping());
  })()
</script>
```


## CONFIG

```
require('quick-serve').start({
  http: {
    enabled: true,
    port: 8080,
    path: {
      '/': './public',
    },
    default: '/index.html'
  },
  socket: {
    enabled: true,
    api: {
      'my-lib': require('./api/lib.js'),
      connection: { 
        connect(socket) { 
          console.log('cn')
        },
        disconnect(socket) {
          console.log('dc')
        }
      }
    }
  }
})
```

