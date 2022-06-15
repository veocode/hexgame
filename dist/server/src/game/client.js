"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Client = exports.ClientState = exports.ClientList = void 0;
class ClientList {
    constructor() {
        this.clients = {};
    }
    add(client) {
        this.clients[client.id] = client;
    }
    remove(client) {
        delete this.clients[client.id];
    }
    includes(client) {
        return client.id in this.clients;
    }
    count() {
        return Object.keys(this.clients).length;
    }
    forEachExcept(exceptClient, callback) {
        Object.values(this.clients).forEach(client => {
            if (client.id === exceptClient.id)
                return;
            callback(client);
        });
    }
}
exports.ClientList = ClientList;
var ClientState;
(function (ClientState) {
    ClientState[ClientState["Idle"] = 0] = "Idle";
    ClientState[ClientState["SearchingGame"] = 1] = "SearchingGame";
    ClientState[ClientState["InGame"] = 2] = "InGame";
})(ClientState = exports.ClientState || (exports.ClientState = {}));
class Client {
    constructor(socket) {
        this.socket = socket;
        this.tag = 0;
        this.state = ClientState.Idle;
        this.id = socket
            ? socket.id
            : this.getId();
        this.nickname = socket
            ? socket.handshake.auth.nickname
            : this.getNickname();
    }
    isBot() {
        return false;
    }
    getId() {
        return this.id;
    }
    getNickname() {
        return this.nickname;
    }
    getTag() {
        return this.tag;
    }
    setTag(tag) {
        this.tag = tag;
    }
    getOpponent() {
        return this.opponent;
    }
    setOpponent(client) {
        if (client)
            this.setInGame();
        this.opponent = client;
    }
    getMatch() {
        return this.match;
    }
    setMatch(match) {
        this.match = match;
    }
    on(eventName, callback) {
        this.socket.on(eventName, callback);
    }
    off(eventName) {
        this.socket.removeAllListeners(eventName);
    }
    send(eventName, ...args) {
        this.socket.emit(eventName, ...args);
    }
    setIdle() {
        this.state = ClientState.Idle;
    }
    isIdle() {
        return this.state === ClientState.Idle;
    }
    setSearchingGame() {
        this.state = ClientState.SearchingGame;
    }
    isSearchingGame() {
        return this.state === ClientState.SearchingGame;
    }
    setInGame() {
        this.state = ClientState.InGame;
    }
    isInGame() {
        return this.state === ClientState.InGame;
    }
}
exports.Client = Client;
//# sourceMappingURL=client.js.map