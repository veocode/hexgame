"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const socket_io_1 = require("socket.io");
const http = require("http");
const config_1 = require("./config");
const httpServer = http.createServer();
const socketServer = new socket_io_1.Server(httpServer, {
    path: config_1.Config.sockets.path,
});
console.log(`Starting server on port ${config_1.Config.sockets.port}...`);
httpServer.listen(config_1.Config.sockets.port);
//# sourceMappingURL=index.js.map