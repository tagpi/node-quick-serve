# node-quick-serve

Basic application with a server


## NPX

```
npx github:tagpi/node-quick-serve [config]
```

example config file [serve.json]:
```
{ 

  http: {
    port: 8080,
    path: {
      '/': './public',
    },
    default: '/index.html'
  },

  api: "./api/index.js"

}
```



## Local Setup 

Create github dependency
```
"dependencies": {
  "@tagpi/node-quick-serve": "git://github.com/tagpi/node-quick-serve.git"
}
```

```
npm i
```


Server:
```
const { serve } = require('@tagpi/node-quick-serve');
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
<script type="module">
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
    console.log(await client.send('server.ping'));
    
  })()
</script>
```

