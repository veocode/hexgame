import { Server } from 'socket.io'
import * as http from 'http'
import { Config } from './config';

const httpServer = http.createServer();
const socketServer = new Server(httpServer, {
    path: Config.sockets.path,
});

console.log(`Starting server on port ${Config.sockets.port}...`)
httpServer.listen(Config.sockets.port);