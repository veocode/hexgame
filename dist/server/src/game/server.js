"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GameServer = void 0;
const socket_io_1 = require("socket.io");
const http = require("http");
const config_1 = require("../config");
const manager_1 = require("../game/manager");
const client_1 = require("../game/client");
class GameServer {
    constructor() {
        this.gameManager = new manager_1.GameManager();
        this.httpServer = http.createServer();
        this.createSocketServer();
        this.bindSocketServerEvents();
        const port = config_1.Config.sockets.port;
        console.log(`Server listening on port ${port}...`);
        this.httpServer.listen(port);
    }
    createSocketServer() {
        this.socketServer = new socket_io_1.Server(this.httpServer, {
            cors: {
                origin: config_1.Config.sockets.corsOrigin,
            }
        });
    }
    bindSocketServerEvents() {
        this.socketServer.on('connection', socket => {
            const client = new client_1.Client(socket);
            this.gameManager.addClient(client);
            socket.on("disconnect", () => {
                this.gameManager.removeClient(client);
            });
        });
        this.socketServer.on('error', e => {
            console.log('error', e);
        });
    }
}
exports.GameServer = GameServer;
//# sourceMappingURL=server.js.map