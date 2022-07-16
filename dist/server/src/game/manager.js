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
const profilemodel_1 = require("../client/profilemodel");
const linked_1 = require("./linked");
const utils_1 = require("./utils");
class GameManager {
    constructor() {
        this.admins = new client_1.ClientList;
        this.clients = new client_1.ClientList;
        this.matches = new utils_1.List();
        this.linkedGames = new utils_1.List();
        this.invites = {};
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
        this.sendLobbyStats();
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
        if (client.linkedGame) {
            this.cancelClientLinkedGame(client);
        }
        if (client.id in this.invites) {
            this.cancelInvite(client);
        }
        this.sendLobbyStats();
    }
    bindClientEvents(client) {
        client.on('game:start-bot', (opts = {}) => {
            let difficulty = botclient_1.BotDifficulty.Normal;
            if (opts.difficultyName === 'easy')
                difficulty = botclient_1.BotDifficulty.Easy;
            if (opts.difficultyName === 'hard')
                difficulty = botclient_1.BotDifficulty.Hard;
            this.createBotGame(client, difficulty, opts.map || []);
        });
        client.on('game:link:create', () => {
            this.createLinkedGame(client);
        });
        client.on('game:link:join', ({ gameId }) => {
            this.joinLinkedGame(gameId, client);
        });
        client.on('game:link:cancel', () => {
            this.cancelClientLinkedGame(client);
        });
        client.on('game:stats-request', () => {
            this.sendLobbyStatsToClient(client);
        });
        client.on('game:maps', () => {
            client.send('game:maps', { count: maps_1.Maps.length });
        });
        client.on('game:map-request', ({ id }) => {
            this.sendMapToEditor(client, id);
        });
        client.on('game:spectate-request', ({ matchId }) => {
            this.spectateMatchByClient(client, matchId);
        });
        client.on('game:spectate-stop', () => {
            this.removeSpectator(client);
        });
        client.on('game:invite-request', ({ playerId }) => {
            this.sendPlayInvite(client, playerId);
        });
        client.on('game:invite-cancel', () => {
            this.cancelInvite(client);
        });
        client.on('game:invite-response', ({ toPlayerId, isAccepted }) => {
            this.sendPlayInviteResponse(client, toPlayerId, isAccepted);
        });
    }
    createBotGame(client, difficulty, map) {
        return __awaiter(this, void 0, void 0, function* () {
            if (client.isConnected()) {
                client.setInGame();
                const botProfile = yield profile_1.Profile.createAndLoad({
                    sourceId: 'bot',
                    nickname: botclient_1.BotClient.getRandomName(difficulty),
                    lang: '??'
                });
                const botOpponent = new botclient_1.BotClient(botProfile, difficulty);
                this.createMatch(client, botOpponent, null, map);
            }
        });
    }
    createLinkedGame(client) {
        const game = new linked_1.LinkedGame();
        game.addClient(client);
        client.linkedGame = game;
        this.linkedGames.add(game);
        game.whenCancelled(() => {
            this.linkedGames.remove(game);
        });
        game.whenReady(gameClients => {
            this.createMatch(gameClients[0], gameClients[1], game);
        });
        client.send('game:link:ready', {
            url: game.getUrl()
        });
    }
    joinLinkedGame(gameId, client) {
        if (!this.linkedGames.hasId(gameId)) {
            return client.send('game:link:not-found');
        }
        this.linkedGames.getById(gameId).addClient(client);
    }
    cancelClientLinkedGame(client) {
        if (!client.linkedGame)
            return;
        client.linkedGame.removeClient(client);
        client.linkedGame = null;
    }
    createMatch(player1, player2, linkedGame = null, map) {
        var _a, _b;
        if (player1.isInGame())
            (_a = player1.getMatch()) === null || _a === void 0 ? void 0 : _a.terminate();
        if (player2.isInGame())
            (_b = player2.getMatch()) === null || _b === void 0 ? void 0 : _b.terminate();
        player1.setInGame();
        player2.setInGame();
        map = map && map.length ? map : this.getRandomMap();
        const match = new match_1.GameMatch(map);
        player1.setOpponent(player2);
        player1.setMatch(match);
        player2.setOpponent(player1);
        player2.setMatch(match);
        match.addPlayer(player1);
        match.addPlayer(player2);
        if (linkedGame)
            match.setLinkedGame(linkedGame);
        match.start();
        match.whenOver((scores) => {
            if (scores && !match.hasLinkedGame()) {
                const tags = [types_1.PlayerTag.Player1, types_1.PlayerTag.Player2];
                tags.forEach(tag => {
                    const player = match.getPlayer(tag);
                    if (player) {
                        const points = scores[tag].delta;
                        player.setIdle();
                        player.getProfile().addScore(points);
                        player.clearBlacklist();
                    }
                });
            }
            this.removeMatch(match);
        });
        this.addMatch(match);
        player1.clearBlacklist();
        player2.clearBlacklist();
    }
    addMatch(match) {
        this.matches.add(match);
        this.sendLobbyStats();
    }
    removeMatch(match) {
        this.matches.remove(match);
        this.sendLobbyStats();
    }
    getStats() {
        const idlePlayers = [];
        const matches = [];
        this.clients.forEach(client => {
            if (!client.isIdle())
                return;
            idlePlayers.push({
                id: client.id,
                nickname: client.getNickname(),
                isBot: false,
                lang: client.getAuthInfo().lang
            });
        });
        this.matches.forEach(match => {
            const player1 = match.getPlayer(types_1.PlayerTag.Player1);
            const player2 = match.getPlayer(types_1.PlayerTag.Player2);
            if (!player1 || !player2)
                return;
            matches.push({
                id: match.id,
                player1: {
                    id: player1.id,
                    nickname: player1.getNickname(),
                    isBot: player1.isBot(),
                    lang: player1.getAuthInfo().lang
                },
                player2: {
                    id: player2.id,
                    nickname: player2.getNickname(),
                    isBot: player2.isBot(),
                    lang: player2.getAuthInfo().lang
                },
                hasBot: match.hasBot()
            });
        });
        return {
            idlePlayers,
            matches
        };
    }
    sendLobbyStats() {
        const stats = this.getStats();
        this.clients.forEach(client => {
            if (!client.isInGame()) {
                client.send('game:stats', stats);
            }
        });
    }
    sendLobbyStatsToClient(client) {
        client.send('game:stats', this.getStats());
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
        if (!this.matches.hasId(matchId))
            return;
        const match = this.matches.getById(matchId);
        match.addSpectator(client);
    }
    removeSpectator(client) {
        const match = client.getMatch();
        if (match)
            match.removeSpectator(client);
    }
    reloadClientProfiles() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.clients.count()) {
                return;
            }
            const promises = [];
            this.clients.forEach(client => promises.push(client.getProfile().reload()));
            return yield Promise.all(promises);
        });
    }
    resetPointsDaily() {
        return __awaiter(this, void 0, void 0, function* () {
            yield profilemodel_1.ProfileModel.resetScore('today');
            yield this.reloadClientProfiles();
        });
    }
    resetPointsMonthly() {
        return __awaiter(this, void 0, void 0, function* () {
            yield profilemodel_1.ProfileModel.resetScore('month');
            yield this.reloadClientProfiles();
        });
    }
    killZombieMatches() {
        return __awaiter(this, void 0, void 0, function* () {
            this.matches.forEach(match => {
                let hasAlivePlayers = false;
                match.forEachPlayer(player => {
                    if (!player)
                        return;
                    if (player.isBot())
                        return;
                    if (!player.isConnected())
                        return;
                    hasAlivePlayers = true;
                });
                if (!hasAlivePlayers || match.getPlayersCount() != 2) {
                    console.log(`killed match: ${match.id}`);
                    match.terminate();
                }
            });
        });
    }
    cancelInvite(inviter) {
        if (inviter.id in this.invites) {
            const invited = this.clients.getById(this.invites[inviter.id]);
            if (invited) {
                invited.send('game:invite-cancel');
            }
            delete this.invites[inviter.id];
        }
    }
    sendPlayInvite(inviter, opponentId) {
        inviter.clearBlacklist();
        const opponent = this.clients.getById(opponentId);
        if (!opponent || !opponent.isConnected()) {
            return inviter.send('game:invite-response', {
                isAccepted: false,
                message: 'not-found'
            });
        }
        if (opponent.isInGameWithHuman()) {
            return inviter.send('game:invite-response', {
                isAccepted: false,
                message: 'busy'
            });
        }
        if (opponent.isBlacklisted(inviter.id)) {
            return inviter.send('game:invite-response', {
                isAccepted: false,
            });
        }
        this.invites[inviter.id] = opponentId;
        opponent.send('game:invite-request', {
            playerId: inviter.id,
            nickname: inviter.getNickname()
        });
    }
    sendPlayInviteResponse(invited, inviterId, isAccepted) {
        if (!isAccepted) {
            invited.addToBlacklist(inviterId);
        }
        const inviter = this.clients.getById(inviterId);
        if (!inviter || !inviter.isConnected()) {
            if (isAccepted)
                invited.send('game:invite-expired');
            return;
        }
        if (!(inviterId in this.invites) || this.invites[inviterId] != invited.id) {
            if (isAccepted)
                invited.send('game:invite-expired');
            return;
        }
        delete this.invites[inviterId];
        if (!isAccepted) {
            inviter.send('game:invite-response', {
                isAccepted: false,
                message: 'rejected'
            });
            if (Object.values(this.invites).includes(invited.id)) {
                let isNextInviteFound = false;
                Object.keys(this.invites).forEach(inviterId => {
                    if (!isNextInviteFound && this.invites[inviterId] === invited.id) {
                        const inviter = this.clients.getById(inviterId);
                        this.sendPlayInvite(inviter, invited.id);
                    }
                });
            }
            return;
        }
        inviter.send('game:invite-response', {
            isAccepted: true,
            message: 'accepted'
        });
        if (Object.values(this.invites).includes(invited.id)) {
            Object.keys(this.invites).forEach(inviterId => {
                if (this.invites[inviterId] === invited.id) {
                    const inviter = this.clients.getById(inviterId);
                    this.cancelInvite(inviter);
                }
            });
        }
        const invitedCurrentMatch = invited.getMatch();
        if (invitedCurrentMatch) {
            if (invitedCurrentMatch.hasSpectator(invited)) {
                invitedCurrentMatch.removeSpectator(invited);
            }
            else {
                invitedCurrentMatch.removePlayer(invited);
            }
        }
        this.createMatch(inviter, invited);
    }
}
exports.GameManager = GameManager;
//# sourceMappingURL=manager.js.map