import mongoose from 'mongoose'
import { Server as SocketIOServer, Socket } from 'socket.io'
import * as https from 'https'
import { Config } from '../config';
import { GameManager } from '../game/manager';
import { Client } from '../game/client';
import { readFileSync } from 'fs';
import { PlayerInfo } from '../shared/player';

export class GameServer {

    private gameManager: GameManager = new GameManager();

    private httpServer: https.Server;
    private socketServer: SocketIOServer;

    constructor() {
        const port = Config.sockets.port;

        // this.connectDatabase().then(() => {
        // console.log(`Connected to database...`);

        this.createHttpServer();
        this.createSocketServer();
        this.bindSocketServerEvents();

        this.httpServer.listen(port, () => {
            console.log(`Server listening at port ${port}...`);
        });
        // }).catch(err => {
        //     console.log(`ERROR: Failed to connect to database: ${err}`);
        //     process.exit(1);
        // });
    }

    async connectDatabase(): Promise<typeof mongoose> {
        return mongoose.connect(`${Config.db.url}/${Config.db.name}`);
    }

    createHttpServer() {
        this.httpServer = https.createServer({
            "key": readFileSync(Config.ssl.keyFile),
            "cert": readFileSync(Config.ssl.certFile),
        });
    }

    createSocketServer() {
        this.socketServer = new SocketIOServer(this.httpServer, {
            transports: ['websocket', 'polling'],
            cors: {
                origin: Config.sockets.corsOrigin,
                methods: ['OPTIONS', 'GET', 'POST']
            }
        });
    }

    bindSocketServerEvents() {
        this.socketServer.on('connection', socket => this.onClientConnected(socket));
    }

    onClientConnected(socket: Socket) {
        let isAdmin = false;
        const info: PlayerInfo = socket.handshake.auth.info;

        [isAdmin, info.nickname] = this.detectAdminByNickname(info.nickname);
        const client = new Client(socket, info, isAdmin);

        console.log('player connected', info);

        this.gameManager.addClient(client);

        socket.on("error", () => socket.disconnect());
        socket.on("disconnect", () => this.gameManager.removeClient(client));

        socket.emit('game:connected', {
            clientId: client.id,
            isAdmin: client.isAdmin()
        })
    }

    detectAdminByNickname(nickname: string): [boolean, string] {
        const isAdmin = nickname === Config.admin.nickname;
        const editedNickname = isAdmin ? nickname.split('#')[0] : nickname;
        return [isAdmin, editedNickname];
    }

}
