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
class GameServer {
    constructor() {
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
            let isAdmin = false;
            const authInfo = socket.handshake.auth.info;
            [isAdmin, authInfo.nickname] = this.detectAdminByNickname(authInfo.nickname);
            const profile = new profile_1.Profile();
            yield profile.load(authInfo);
            const client = new client_1.Client(socket, authInfo, isAdmin);
            this.gameManager.addClient(client);
            socket.on("error", () => socket.disconnect());
            socket.on("disconnect", () => this.gameManager.removeClient(client));
            socket.emit('game:connected', {
                clientId: client.id,
                isAdmin: client.isAdmin()
            });
        });
    }
    detectAdminByNickname(nickname) {
        const isAdmin = nickname === config_1.Config.admin.nickname;
        const editedNickname = isAdmin ? nickname.split('#')[0] : nickname;
        return [isAdmin, editedNickname];
    }
    halt(errorMessage) {
        console.log(`FATAL: ${errorMessage}`);
        process.exit(1);
    }
}
exports.GameServer = GameServer;
//# sourceMappingURL=server.js.map