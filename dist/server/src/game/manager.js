"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GameManager = void 0;
const client_1 = require("./client");
const match_1 = require("./match");
const maps_1 = require("./maps");
const botclient_1 = require("./botclient");
class GameManager {
    constructor() {
        this.admins = new client_1.ClientList;
        this.clients = new client_1.ClientList;
        this.matches = [];
    }
    addClient(client) {
        this.clients.add(client);
        if (client.isAdmin())
            this.admins.add(client);
        this.bindClientEvents(client);
        this.sendStatsToAdmins();
    }
    removeClient(client) {
        if (client.isAdmin())
            this.admins.remove(client);
        if (this.clients.remove(client)) {
            const activeMatch = client.getMatch();
            if (activeMatch) {
                activeMatch.removePlayer(client);
                if (client.getOpponent()) {
                    const remainingPlayer = activeMatch.getPlayer(client.getOpponent().getTag());
                    if (remainingPlayer && remainingPlayer.isBot()) {
                        activeMatch.terminate();
                    }
                }
            }
        }
        this.sendStatsToAdmins();
    }
    bindClientEvents(client) {
        client.on('game:search-request', () => {
            this.searchGameForClient(client);
        });
        client.on('game:stats-request', () => {
            if (!client.isAdmin())
                return;
            this.sendStatsToAdmin(client);
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
        this.sendStatsToAdmins();
    }
    removeMatch(match) {
        const index = this.matches.indexOf(match);
        if (index >= 0)
            this.matches.splice(index);
        this.sendStatsToAdmins();
    }
    getStats() {
        let adminCount = this.admins.count();
        let playerCount = this.clients.count() - adminCount;
        let botCount = 0;
        this.matches.forEach(match => match.hasBot() && botCount++);
        return {
            players: playerCount,
            bots: botCount,
            admins: adminCount,
            matches: this.matches.length
        };
    }
    sendStatsToAdmins() {
        const stats = this.getStats();
        this.admins.forEach(admin => {
            admin.send('game:stats', stats);
        });
    }
    sendStatsToAdmin(admin) {
        if (!admin.isAdmin())
            return;
        admin.send('game:stats', this.getStats());
    }
    getRandomMap() {
        return maps_1.Maps[Math.floor(Math.random() * maps_1.Maps.length)];
    }
}
exports.GameManager = GameManager;
//# sourceMappingURL=manager.js.map