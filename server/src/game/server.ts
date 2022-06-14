import * as express from 'express'
import { Server as SocketIOServer } from 'socket.io'
import * as https from 'https'
import * as cors from 'cors'
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
        this.express.use(cors());

        this.httpsServer = https.createServer({
            "key": readFileSync(Config.ssl.keyFile),
            "cert": readFileSync(Config.ssl.certFile),
        }, this.express);

        this.createSocketServer();
        this.bindSocketServerEvents();

        const port = Config.sockets.port;
        console.log('Server Configuration: ', Config);
        console.log(`Server listening...`);
        this.httpsServer.listen(port);
    }

    createSocketServer() {
        this.socketServer = new SocketIOServer(this.httpsServer, {
            cors: {
                origin: Config.sockets.corsOrigin,
                methods: ['OPTIONS', 'GET', 'POST']
            }
        });
    }

    bindSocketServerEvents() {
        this.socketServer.on('connection', socket => {
            const client = new Client(socket);

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
