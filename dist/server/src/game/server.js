"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GameServer = void 0;
const express = require("express");
const socket_io_1 = require("socket.io");
const https = require("https");
const config_1 = require("../config");
const manager_1 = require("../game/manager");
const client_1 = require("../game/client");
const fs_1 = require("fs");
class GameServer {
    constructor() {
        this.gameManager = new manager_1.GameManager();
        this.express = express();
        this.httpsServer = https.createServer({
            "key": (0, fs_1.readFileSync)(config_1.Config.ssl.keyFile),
            "cert": (0, fs_1.readFileSync)(config_1.Config.ssl.certFile),
        }, this.express);
        this.createSocketServer();
        this.bindSocketServerEvents();
        const port = config_1.Config.sockets.port;
        console.log('Server Configuration: ', config_1.Config, '\n');
        console.log(`Server listening at port ${port}...`);
        this.httpsServer.listen(port);
    }
    createSocketServer() {
        this.socketServer = new socket_io_1.Server(this.httpsServer, {
            transports: ['websocket', 'polling'],
            cors: {
                origin: config_1.Config.sockets.corsOrigin,
                methods: ['OPTIONS', 'GET', 'POST']
            }
        });
    }
    bindSocketServerEvents() {
        this.socketServer.on('connection', socket => {
            var _a;
            let nickname = socket.handshake.auth.nickname;
            let lang = (_a = socket.handshake.auth.lang) !== null && _a !== void 0 ? _a : '??';
            const isAdmin = nickname === config_1.Config.admin.nickname;
            if (isAdmin)
                nickname = nickname.split('#')[0];
            const client = new client_1.Client(socket, nickname, lang, isAdmin);
            this.gameManager.addClient(client);
            socket.emit('game:connected', {
                clientId: client.id,
                isAdmin: client.isAdmin()
            });
            socket.on("disconnect", () => {
                this.gameManager.removeClient(client);
            });
        });
    }
}
exports.GameServer = GameServer;
//# sourceMappingURL=server.js.map