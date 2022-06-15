"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GameManager = void 0;
const client_1 = require("./client");
const match_1 = require("./match");
const maps_1 = require("./maps");
const botclient_1 = require("./botclient");
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
            const remainingPlayer = activeMatch.getPlayer(client.getOpponent().getTag());
            if (remainingPlayer && remainingPlayer.isBot()) {
                activeMatch.terminate();
            }
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
            return this.createMatch(client, opponentClient);
        }
        setTimeout(() => {
            if (client.isSearchingGame()) {
                client.setInGame();
                const botOpponent = new botclient_1.BotClient(null);
                this.createMatch(client, botOpponent);
            }
        }, 3000);
    }
    createMatch(player1, player2) {
        const match = new match_1.GameMatch(this.getRandomMap());
        player1.setOpponent(player2);
        player1.setMatch(match);
        player2.setOpponent(player1);
        player2.setMatch(match);
        match.addPlayer(player1);
        match.addPlayer(player2);
        match.start();
        match.whenOver(() => this.removeMatch(match));
        this.addMatch(match);
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