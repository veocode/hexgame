"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LinkedGame = void 0;
const client_1 = require("../client/client");
const config_1 = require("../config");
const utils_1 = require("./utils");
class LinkedGame {
    constructor(clientsToStart = 2) {
        this.clientsToStart = clientsToStart;
        this.clients = new client_1.ClientList();
        this.callbacks = {};
        this.id = (0, utils_1.generateId)();
    }
    getUrl() {
        return `${config_1.Config.host}/?g=${encodeURI(this.id)}`;
    }
    addClient(client) {
        this.clients.add(client);
        if (this.clients.count() === this.clientsToStart) {
            if (this.callbacks.Ready)
                this.callbacks.Ready(this.clients.toArray());
        }
    }
    removeClient(client) {
        if (this.clients.remove(client) && this.clients.count() === 0) {
            if (this.callbacks.Cancelled)
                this.callbacks.Cancelled();
        }
    }
    whenCancelled(callback) {
        this.callbacks.Cancelled = callback;
    }
    whenReady(callback) {
        this.callbacks.Ready = callback;
    }
}
exports.LinkedGame = LinkedGame;
//# sourceMappingURL=linked.js.map