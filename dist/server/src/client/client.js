"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Client = exports.ClientState = exports.ClientList = void 0;
const types_1 = require("../shared/types");
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
    send(eventName, ...args) {
        this.forEach(client => client.send(eventName, ...args));
    }
    disconnect() {
        this.forEach(client => client.disconnect());
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
    constructor(socket, profile, isAdministrator = false) {
        this.socket = socket;
        this.profile = profile;
        this.state = ClientState.Idle;
        this.tag = 0;
        this.isAdministrator = false;
        this.missedTurnsCount = 0;
        this.id = socket ? socket.id : this.getId();
        if (isAdministrator)
            this.setAdmin();
    }
    isBot() {
        return false;
    }
    isGuest() {
        return !this.isBot()
            && 'sourceId' in this.profile.authInfo
            && this.profile.authInfo.sourceId.startsWith('g-');
    }
    isConnected() {
        return this.socket.connected;
    }
    getId() {
        return this.id;
    }
    getProfile() {
        return this.profile;
    }
    getAuthInfo() {
        return this.profile.authInfo;
    }
    getNickname() {
        return this.profile.nickname;
    }
    getNicknameWithIcon(isPrepend = true) {
        const icon = this.isBot() ? '🤖' : (this.isGuest() ? '👤' : '👨🏼‍💼');
        return isPrepend ? `${icon} ${this.profile.authInfo.nickname}` : `${this.profile.authInfo.nickname} ${icon}`;
    }
    isAdmin() {
        return this.isAdministrator;
    }
    setAdmin() {
        this.isAdministrator = true;
    }
    getTag() {
        return this.tag;
    }
    setTag(tag) {
        this.tag = tag;
    }
    getOpponentTag() {
        return this.getTag() === types_1.PlayerTag.Player1
            ? types_1.PlayerTag.Player2
            : types_1.PlayerTag.Player1;
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