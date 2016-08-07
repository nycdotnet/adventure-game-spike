import * as Hapi from 'hapi';
import * as Inert from 'inert';

const server = new Hapi.Server();
server.connection({ host: 'localhost', port: 3000 });
server.register(Inert, () => {});

server.route({
    path: '/',
    method: 'GET',
    handler: {
        file: 'public/index.html'
    }
});

const routeDirMap = {
  '/{path*}': './public',
  '/scripts/phaser/{path*}': './node_modules/phaser/build/',
  '/scripts/app/{path*}': './app/',
};

for (let route in routeDirMap) {
  console.log("mapping directory " + routeDirMap[route] + " as route " + route);
  server.route({
      path: route,
      method: 'GET',
      handler: {
          directory: {
              path: routeDirMap[route],
              listing: false
          }
      }
  });
}

server.start(function () {
    console.log("Listening on " + server.info.uri);
});
