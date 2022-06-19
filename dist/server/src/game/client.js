"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Client = exports.ClientState = exports.ClientList = void 0;
const player_1 = require("../shared/player");
class ClientList {
    constructor() {
        this.clients = {};
    }
    add(client) {
        this.clients[client.id] = client;
    }
    remove(client) {
        if (client.id in this.clients) {
            delete this.clients[client.id];
            return true;
        }
        return false;
    }
    includes(client) {
        return client.id in this.clients;
    }
    count() {
        return Object.keys(this.clients).length;
    }
    forEach(callback) {
        Object.values(this.clients).forEach(client => {
            callback(client);
        });
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
class Client extends player_1.Player {
    constructor(socket, nickname = '', isAdministrator = false) {
        super();
        this.socket = socket;
        this.nickname = nickname;
        this.state = ClientState.Idle;
        this.missedTurnsCount = 0;
        this.id = socket
            ? socket.id
            : this.getId();
        if (!nickname)
            this.nickname = this.getNickname();
        if (isAdministrator)
            this.setAdmin();
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
    disconnect() {
        this.socket.disconnect();
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
    setTurnTimeout(callback, ms = 10000) {
        this.stopTurnTimeout();
        this.turnTimeout = setTimeout(() => callback(), ms);
    }
    stopTurnTimeout() {
        if (this.turnTimeout)
            clearTimeout(this.turnTimeout);
        this.turnTimeout = null;
    }
    resetMissedTurns() {
        this.missedTurnsCount = 0;
    }
    addMissedTurn() {
        this.missedTurnsCount += 1;
    }
    getMissedTurns() {
        return this.missedTurnsCount;
    }
}
exports.Client = Client;
//# sourceMappingURL=client.js.map