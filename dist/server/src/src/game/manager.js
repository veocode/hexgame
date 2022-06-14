"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GameManager = void 0;
const client_1 = require("./client");
const match_1 = require("./match");
const maps_1 = require("./maps");
class GameManager {
    constructor() {
        this.clients = new client_1.ClientList;
        this.matches = [];
    }
    addClient(client) {
        this.clients.add(client);
        this.bindClientEvents(client);
        console.log(`Client connected: ${client.nickname}, Players Online: ${this.clients.count()}`);
    }
    removeClient(client) {
        this.clients.remove(client);
        console.log(`Client left: ${client.nickname}, Players Online: ${this.clients.count()}`);
        const activeMatch = client.getMatch();
        if (activeMatch) {
            activeMatch.removePlayer(client);
        }
    }
    bindClientEvents(client) {
        client.on('game:search-request', () => {
            this.searchGameForClient(client);
        });
    }
    searchGameForClient(client) {
        client.setSearchingGame();
        let opponentClient;
        this.clients.forEachExcept(client, otherClient => {
            if (opponentClient || !otherClient.isSearchingGame())
                return;
            opponentClient = otherClient;
        });
        if (opponentClient) {
            const match = new match_1.GameMatch(this.getRandomMap());
            client.setOpponent(opponentClient);
            client.setMatch(match);
            opponentClient.setOpponent(client);
            opponentClient.setMatch(match);
            match.addPlayer(client);
            match.addPlayer(opponentClient);
            match.start();
            match.whenOver(() => this.removeMatch(match));
            this.addMatch(match);
        }
    }
    addMatch(match) {
        this.matches.push(match);
    }
    removeMatch(match) {
        const index = this.matches.indexOf(match);
        if (index >= 0)
            this.matches.splice(index);
    }
    getRandomMap() {
        return maps_1.Maps[Math.floor(Math.random() * maps_1.Maps.length)];
    }
}
exports.GameManager = GameManager;
//# sourceMappingURL=manager.js.map