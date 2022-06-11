import { Server as SocketIOServer } from 'socket.io'
import * as http from 'http'
import { Config } from '../config';
import { GameManager } from '../game/manager';
import { Client } from '../game/client';

export class GameServer {

    private gameManager: GameManager = new GameManager();
    private httpServer: http.Server = http.createServer();
    private socketServer: SocketIOServer;

    constructor() {
        this.createSocketServer();
        this.bindSocketServerEvents();

        const port = Config.sockets.port;
        console.log(`Server listening on port ${port}...`);
        this.httpServer.listen(port);
    }

    createSocketServer() {
        this.socketServer = new SocketIOServer(this.httpServer, {
            cors: {
                origin: Config.sockets.corsOrigin,
                methods: ["GET", "POST"]
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
