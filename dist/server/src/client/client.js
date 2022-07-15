"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Client = exports.ClientList = exports.ClientState = void 0;
const types_1 = require("../shared/types");
const utils_1 = require("../game/utils");
var ClientState;
(function (ClientState) {
    ClientState[ClientState["Idle"] = 0] = "Idle";
    ClientState[ClientState["SearchingGame"] = 1] = "SearchingGame";
    ClientState[ClientState["InGame"] = 2] = "InGame";
})(ClientState = exports.ClientState || (exports.ClientState = {}));
class ClientList extends utils_1.List {
    send(eventName, ...args) {
        this.forEach(client => client.send(eventName, ...args));
    }
    disconnect() {
        this.forEach(client => client.disconnect());
    }
}
exports.ClientList = ClientList;
class Client {
    constructor(socket, profile, isAdministrator = false) {
        this.socket = socket;
        this.profile = profile;
        this.linkedGame = null;
        this.state = ClientState.Idle;
        this.tag = 0;
        this.isAdministrator = false;
        this.missedTurnsCount = 0;
        this.inviteBlacklist = [];
        this.id = socket ? socket.id : this.getId();
        if (isAdministrator)
            this.setAdmin();
    }
    getScoreMultiplier() {
        return 1;
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
        const icon = this.isGuest() ? '👤' : '👨🏼‍💼';
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
        this.socket.disconnect(true);
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
    isInGameWithHuman() {
        if (!this.isInGame())
            return false;
        const opponent = this.getOpponent();
        if (!opponent)
            return false;
        return !opponent.isBot();
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
    addToBlacklist(clientId) {
        this.inviteBlacklist.push(clientId);
    }
    isBlacklisted(clientId) {
        return this.inviteBlacklist.indexOf(clientId) >= 0;
    }
    clearBlacklist() {
        this.inviteBlacklist = [];
    }
}
exports.Client = Client;
//# sourceMappingURL=client.js.map