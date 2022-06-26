import * as https from 'https'
import mongoose from 'mongoose'
import { Server as SocketIOServer, Socket } from 'socket.io'
import { Config } from './config';
import { GameManager } from './game/manager';
import { Client } from './client/client';
import { readFileSync } from 'fs';
import { AuthInfo } from './client/authinfo';
import { Profile } from './client/profile';
import { ProfileModel } from './client/profilemodel';

interface TopPlayerInfo {
    place: number,
    name: string,
    points: number,
    avatarUrl?: string
}

type TopPlayersDict = { [period: string]: TopPlayerInfo[] };

export class GameServer {

    private sockets: { [key: string]: Socket } = {};
    private gameManager: GameManager = new GameManager();

    private httpServer: https.Server;
    private socketServer: SocketIOServer;

    constructor() {
        console.log(`Starting server with configuration: `, Config);

        const port = Config.sockets.port;
        this.connectDatabase().then(() => {
            console.log(`Connected to database...`);

            this.createHttpServer();
            this.createSocketServer();
            this.bindSocketServerEvents();

            this.httpServer.listen(port, () => {
                console.log(`Server listening at port ${port}...`);
            });

        }).catch(err => this.halt(`Database connection error: ${err}`));
    }

    async connectDatabase(): Promise<typeof mongoose> {
        if (!Config.db.url || !Config.db.name) this.halt(`Database config missed`);
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

    async onClientConnected(socket: Socket) {
        this.registerSocket(socket);
        socket.on("error", () => socket.disconnect());
        socket.on("disconnect", () => this.unregisterSocket(socket));
        socket.on("game:login", ({ authInfo }) => this.onClientLogin(socket, authInfo));
        socket.emit('game:connected');
    }

    async onClientLogin(socket: Socket, authInfo: AuthInfo) {
        let isAdmin = false;
        [isAdmin, authInfo.nickname] = this.detectAdminByNickname(authInfo.nickname);

        const profile = await Profile.createAndLoad(authInfo);
        const client = new Client(socket, profile, isAdmin);

        this.gameManager.addClient(client);

        socket.on("disconnect", () => this.gameManager.removeClient(client));
        client.on("game:lobby", () => this.sendLobbyData(client));

        const topPlayers = await this.getTopPlayers(['today', 'total'], 5);

        socket.emit('game:logged', {
            clientId: client.id,
            isAdmin: client.isAdmin(),
            topPlayers,
            score: profile.getScore()
        })
    }

    detectAdminByNickname(nickname: string): [boolean, string] {
        const isAdmin = nickname === Config.admin.nickname;
        const editedNickname = isAdmin ? nickname.split('#')[0] : nickname;
        return [isAdmin, editedNickname];
    }

    async sendLobbyData(client: Client) {
        const topPlayers = await this.getTopPlayers(['today', 'total'], 5);
        const score = client.getProfile().getScore();

        client.send('game:lobby', {
            topPlayers,
            score
        })
    }

    async getTopPlayers(periods: string[], count: number): Promise<TopPlayersDict> {
        const topPlayers: TopPlayersDict = {};
        const periodPromises = [];
        periods.forEach(period => {
            periodPromises.push(ProfileModel.getTopPlayers(period, 5).then(players => {
                topPlayers[period] = players.map((profile, index) => {
                    return {
                        place: index + 1,
                        name: profile.name.replace('#admin', ''),
                        points: profile.score[period] || 0
                    }
                });
            }))
        });

        await Promise.all(periodPromises);
        return topPlayers;
    }

    halt(errorMessage: string) {
        console.log(`FATAL: ${errorMessage}`);
        process.exit(1);
    }

    registerSocket(socket: Socket) {
        console.log('registered: ', socket.id)
        this.sockets[socket.id] = socket;
    }

    unregisterSocket(socket: Socket) {
        console.log('unregistered: ', socket.id)
        if (socket.id in this.sockets) delete this.sockets[socket.id];
    }

}
