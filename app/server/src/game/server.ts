import * as express from 'express'
import { Server as SocketIOServer } from 'socket.io'
import * as https from 'https'
import { Config } from '../config';
import { GameManager } from '../game/manager';
import { Client } from '../game/client';
import { readFileSync } from 'fs';

export class GameServer {

    private gameManager: GameManager = new GameManager();

    private express = express();
    private httpsServer: https.Server;
    private socketServer: SocketIOServer;

    constructor() {
        this.httpsServer = https.createServer({
            "key": readFileSync(Config.ssl.keyFile),
            "cert": readFileSync(Config.ssl.certFile),
        }, this.express);

        this.createSocketServer();
        this.bindSocketServerEvents();

        const port = Config.sockets.port;
        console.log('Server Configuration: ', Config, '\n');
        console.log(`Server listening at port ${port}...`);
        this.httpsServer.listen(port);
    }

    createSocketServer() {
        this.socketServer = new SocketIOServer(this.httpsServer, {
            transports: ['websocket', 'polling'],
            cors: {
                origin: Config.sockets.corsOrigin,
                methods: ['OPTIONS', 'GET', 'POST']
            }
        });
    }

    bindSocketServerEvents() {
        this.socketServer.on('connection', socket => {
            let nickname = socket.handshake.auth.nickname;
            let lang = socket.handshake.auth.lang ?? '??';
            const isAdmin = nickname === Config.admin.nickname;

            if (isAdmin) nickname = nickname.split('#')[0];
            const client = new Client(socket, nickname, lang, isAdmin);

            this.gameManager.addClient(client);

            socket.emit('game:connected', {
                clientId: client.id,
                isAdmin: client.isAdmin()
            })

            socket.on("error", () => socket.disconnect());

            socket.on("disconnect", () => {
                this.gameManager.removeClient(client);
            });
        });
    }

}
