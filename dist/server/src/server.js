"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GameServer = void 0;
const https = require("https");
const mongoose_1 = require("mongoose");
const socket_io_1 = require("socket.io");
const config_1 = require("./config");
const manager_1 = require("./game/manager");
const client_1 = require("./client/client");
const fs_1 = require("fs");
const profile_1 = require("./client/profile");
const profilemodel_1 = require("./client/profilemodel");
class GameServer {
    constructor() {
        this.sockets = {};
        this.gameManager = new manager_1.GameManager();
        console.log(`Starting server with configuration: `, config_1.Config);
        const port = config_1.Config.sockets.port;
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
    connectDatabase() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!config_1.Config.db.url || !config_1.Config.db.name)
                this.halt(`Database config missed`);
            return mongoose_1.default.connect(`${config_1.Config.db.url}/${config_1.Config.db.name}`);
        });
    }
    createHttpServer() {
        this.httpServer = https.createServer({
            "key": (0, fs_1.readFileSync)(config_1.Config.ssl.keyFile),
            "cert": (0, fs_1.readFileSync)(config_1.Config.ssl.certFile),
        });
    }
    createSocketServer() {
        this.socketServer = new socket_io_1.Server(this.httpServer, {
            transports: ['websocket', 'polling'],
            cors: {
                origin: config_1.Config.sockets.corsOrigin,
                methods: ['OPTIONS', 'GET', 'POST']
            }
        });
    }
    bindSocketServerEvents() {
        this.socketServer.on('connection', socket => this.onClientConnected(socket));
    }
    onClientConnected(socket) {
        return __awaiter(this, void 0, void 0, function* () {
            this.registerSocket(socket);
            socket.on("error", () => socket.disconnect());
            socket.on("disconnect", () => this.unregisterSocket(socket));
            socket.on("game:login", ({ authInfo }) => this.onClientLogin(socket, authInfo));
            socket.emit('game:connected');
        });
    }
    onClientLogin(socket, authInfo) {
        return __awaiter(this, void 0, void 0, function* () {
            let isAdmin = false;
            [isAdmin, authInfo.nickname] = this.detectAdminByNickname(authInfo.nickname);
            const profile = yield profile_1.Profile.createAndLoad(authInfo);
            const client = new client_1.Client(socket, profile, isAdmin);
            this.gameManager.addClient(client);
            socket.on("disconnect", () => this.gameManager.removeClient(client));
            client.on("game:lobby", () => this.sendLobbyData(client));
            const topPlayers = yield this.getTopPlayers(['today', 'total'], 5);
            socket.emit('game:logged', {
                clientId: client.id,
                isAdmin: client.isAdmin(),
                topPlayers,
                score: profile.getScore()
            });
        });
    }
    detectAdminByNickname(nickname) {
        const isAdmin = nickname === config_1.Config.admin.nickname;
        const editedNickname = isAdmin ? nickname.split('#')[0] : nickname;
        return [isAdmin, editedNickname];
    }
    sendLobbyData(client) {
        return __awaiter(this, void 0, void 0, function* () {
            const topPlayers = yield this.getTopPlayers(['today', 'total'], 5);
            const score = client.getProfile().getScore();
            client.send('game:lobby', {
                topPlayers,
                score
            });
        });
    }
    getTopPlayers(periods, count) {
        return __awaiter(this, void 0, void 0, function* () {
            const topPlayers = {};
            const periodPromises = [];
            periods.forEach(period => {
                periodPromises.push(profilemodel_1.ProfileModel.getTopPlayers(period, 5).then(players => {
                    topPlayers[period] = players.map((profile, index) => {
                        return {
                            place: index + 1,
                            name: profile.name.replace('#admin', ''),
                            points: profile.score[period] || 0
                        };
                    });
                }));
            });
            yield Promise.all(periodPromises);
            return topPlayers;
        });
    }
    halt(errorMessage) {
        console.log(`FATAL: ${errorMessage}`);
        process.exit(1);
    }
    registerSocket(socket) {
        console.log('registered: ', socket.id);
        this.sockets[socket.id] = socket;
    }
    unregisterSocket(socket) {
        console.log('unregistered: ', socket.id);
        if (socket.id in this.sockets)
            delete this.sockets[socket.id];
    }
}
exports.GameServer = GameServer;
//# sourceMappingURL=server.js.map