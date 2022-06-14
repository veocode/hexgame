import { Server as SocketIOServer } from 'socket.io'
import * as https from 'https'
import { Config } from '../config';
import { GameManager } from '../game/manager';
import { Client } from '../game/client';
import { readFileSync } from 'fs';

export class GameServer {

    private gameManager: GameManager = new GameManager();
    private httpsServer: https.Server;
    private socketServer: SocketIOServer;

    constructor() {
        this.httpsServer = https.createServer({
            "key": readFileSync(Config.ssl.keyFile),
            "cert": readFileSync(Config.ssl.certFile),
        });

        this.createSocketServer();
        this.bindSocketServerEvents();

        const port = Config.sockets.port;
        console.log(`Server listening on port ${port}...`);
        this.httpsServer.listen(port);
    }

    createSocketServer() {
        this.socketServer = new SocketIOServer(this.httpsServer, {
            cors: {
                origin: Config.sockets.corsOrigin,
                methods: ['GET', 'POST', 'OPTIONS'],
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
