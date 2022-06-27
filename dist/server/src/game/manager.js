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
exports.GameManager = void 0;
const client_1 = require("../client/client");
const match_1 = require("./match");
const maps_1 = require("./maps");
const botclient_1 = require("../client/botclient");
const types_1 = require("../shared/types");
const profile_1 = require("../client/profile");
class GameManager {
    constructor() {
        this.admins = new client_1.ClientList;
        this.clients = new client_1.ClientList;
        this.matches = {};
        this.mapPool = [];
    }
    getRandomMap() {
        if (this.mapPool.length == 0) {
            this.mapPool = [...maps_1.Maps];
            this.mapPool.sort(() => Math.random() - 0.5);
        }
        return this.mapPool.pop();
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
                if (activeMatch.hasBot()) {
                    activeMatch.terminate();
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
        client.on('game:maps', () => {
            if (!client.isAdmin())
                return;
            client.send('game:maps', { count: maps_1.Maps.length });
        });
        client.on('game:map-request', ({ id }) => {
            if (!client.isAdmin())
                return;
            this.sendMapToEditor(client, id);
        });
        client.on('game:spectate-request', ({ matchId }) => {
            this.spectateMatchByClient(client, matchId);
        });
        client.on('game:spectate-stop', () => {
            this.removeSpectator(client);
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
        setTimeout(() => __awaiter(this, void 0, void 0, function* () {
            if (client.isConnected() && client.isSearchingGame()) {
                client.setInGame();
                const botProfile = yield profile_1.Profile.createAndLoad({
                    sourceId: 'bot',
                    nickname: botclient_1.BotClient.getRandomName(),
                    lang: '??'
                });
                const botOpponent = new botclient_1.BotClient(botProfile);
                this.createMatch(client, botOpponent);
            }
        }), 3000);
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
        match.whenOver((scores) => {
            if (scores) {
                const tags = [types_1.PlayerTag.Player1, types_1.PlayerTag.Player2];
                tags.forEach(tag => {
                    const player = match.getPlayer(tag);
                    if (player) {
                        const points = scores[tag].delta;
                        player.getProfile().addScore(points);
                    }
                });
            }
            this.removeMatch(match);
        });
        this.addMatch(match);
    }
    addMatch(match) {
        this.matches[match.id] = match;
        this.sendStatsToAdmins();
    }
    removeMatch(match) {
        if (match.id in this.matches) {
            delete this.matches[match.id];
        }
        this.sendStatsToAdmins();
    }
    getStats() {
        let botCount = 0;
        let admins = [];
        let players = [];
        let matches = [];
        this.clients.forEach(client => {
            if (client.isAdmin())
                return admins.push(client.getNicknameWithIcon());
            players.push({
                nickname: client.getNicknameWithIcon(),
                lang: client.getAuthInfo().lang
            });
        });
        Object.values(this.matches).forEach(match => {
            var _a, _b;
            if (match.hasBot())
                botCount++;
            matches.push({
                id: match.id,
                player1: (_a = match.getPlayer(types_1.PlayerTag.Player1)) === null || _a === void 0 ? void 0 : _a.getNicknameWithIcon(),
                player2: (_b = match.getPlayer(types_1.PlayerTag.Player2)) === null || _b === void 0 ? void 0 : _b.getNicknameWithIcon(false)
            });
        });
        return {
            players: {
                count: players.length,
                list: players
            },
            bots: botCount,
            admins: {
                count: admins.length,
                list: admins
            },
            matches: {
                count: matches.length,
                list: matches
            }
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
    sendMapToEditor(client, mapId) {
        if (mapId >= 0 && mapId < maps_1.Maps.length) {
            client.send('game:map', {
                id: mapId,
                map: maps_1.Maps[mapId]
            });
        }
    }
    spectateMatchByClient(client, matchId) {
        if (!(matchId in this.matches))
            return;
        const match = this.matches[matchId];
        match.addSpectator(client);
    }
    removeSpectator(client) {
        const match = client.getMatch();
        if (match)
            match.removeSpectator(client);
    }
}
exports.GameManager = GameManager;
//# sourceMappingURL=manager.js.map