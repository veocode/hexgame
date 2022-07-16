import { Client, ClientList } from "../client/client";
import { GameMatch, MatchScoreList } from "./match";
import { Maps } from "./maps";
import { BotClient, BotDifficulty } from "../client/botclient";
import { PlayerTag } from "../shared/types";
import { Profile } from "../client/profile";
import { ProfileModel } from "../client/profilemodel";
import { LinkedGame } from "./linked";
import { List } from "./utils";

interface ServerPlayerDescription {
    id: string,
    nickname: string,
    isBot: boolean,
    lang: string
}

interface ServerMatchDescription {
    id: string,
    player1: ServerPlayerDescription,
    player2: ServerPlayerDescription,
    hasBot: boolean
}

interface ServerStats {
    idlePlayers: ServerPlayerDescription[],
    matches: ServerMatchDescription[]
}

export class GameManager {

    private admins: ClientList = new ClientList;
    private clients: ClientList = new ClientList;
    private matches: List<GameMatch> = new List<GameMatch>();

    private linkedGames: List<LinkedGame> = new List<LinkedGame>();
    private invites: { [fromId: string]: string } = {};

    private mapPool: number[][] = [];


    private getRandomMap(): number[] {
        if (this.mapPool.length == 0) {
            this.mapPool = [...Maps];
            this.mapPool.sort(() => Math.random() - 0.5);
        }

        return this.mapPool.pop();
    }

    addClient(client: Client) {
        this.clients.add(client);
        if (client.isAdmin()) this.admins.add(client);

        this.bindClientEvents(client);
        this.sendLobbyStats();
    }

    removeClient(client: Client) {
        if (client.isAdmin()) this.admins.remove(client);

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

    bindClientEvents(client: Client) {
        client.on('game:start-bot', (opts = {}) => {
            let difficulty = BotDifficulty.Normal;
            if (opts.difficultyName === 'easy') difficulty = BotDifficulty.Easy;
            if (opts.difficultyName === 'hard') difficulty = BotDifficulty.Hard;
            console.log('opts.map', opts.map);
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
        })

        client.on('game:maps', () => {
            client.send('game:maps', { count: Maps.length });
        })

        client.on('game:map-request', ({ id }) => {
            this.sendMapToEditor(client, id);
        })

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

    async createBotGame(client: Client, difficulty: BotDifficulty, map?: number[]) {
        if (client.isConnected()) {
            client.setInGame();

            const botProfile = await Profile.createAndLoad({
                sourceId: 'bot',
                nickname: BotClient.getRandomName(difficulty),
                lang: '??'
            })

            const botOpponent = new BotClient(botProfile, difficulty);
            this.createMatch(client, botOpponent, null, map);
        }
    }

    createLinkedGame(client: Client) {
        const game = new LinkedGame();

        game.addClient(client);
        client.linkedGame = game;
        this.linkedGames.add(game);

        game.whenCancelled(() => {
            this.linkedGames.remove(game);
        })

        game.whenReady(gameClients => {
            this.createMatch(gameClients[0], gameClients[1], game);
        })

        client.send('game:link:ready', {
            url: game.getUrl()
        })
    }

    joinLinkedGame(gameId: string, client: Client) {
        if (!this.linkedGames.hasId(gameId)) {
            return client.send('game:link:not-found');
        }

        this.linkedGames.getById(gameId).addClient(client);
    }

    cancelClientLinkedGame(client: Client) {
        if (!client.linkedGame) return;
        client.linkedGame.removeClient(client);
        client.linkedGame = null;
    }

    createMatch(player1: Client, player2: Client, linkedGame: LinkedGame | null = null, map?: number[]) {
        if (player1.isInGame()) player1.getMatch()?.terminate();
        if (player2.isInGame()) player2.getMatch()?.terminate();

        player1.setInGame();
        player2.setInGame();

        const match = new GameMatch(map || this.getRandomMap());

        player1.setOpponent(player2);
        player1.setMatch(match);

        player2.setOpponent(player1);
        player2.setMatch(match);

        match.addPlayer(player1);
        match.addPlayer(player2);

        if (linkedGame) match.setLinkedGame(linkedGame);
        match.start();

        match.whenOver((scores: MatchScoreList | null) => {
            if (scores && !match.hasLinkedGame()) {
                const tags = [PlayerTag.Player1, PlayerTag.Player2];
                tags.forEach(tag => {
                    const player = match.getPlayer(tag);
                    if (player) {
                        const points = scores[tag].delta;
                        player.setIdle();
                        player.getProfile().addScore(points);
                        player.clearBlacklist();
                    }
                })
            }
            this.removeMatch(match);
        });

        this.addMatch(match);

        player1.clearBlacklist();
        player2.clearBlacklist();
    }

    addMatch(match: GameMatch) {
        this.matches.add(match);
        this.sendLobbyStats();
    }

    removeMatch(match: GameMatch) {
        this.matches.remove(match);
        this.sendLobbyStats();
    }

    getStats(): ServerStats {
        const idlePlayers: ServerPlayerDescription[] = [];
        const matches: ServerMatchDescription[] = [];

        this.clients.forEach(client => {
            if (!client.isIdle()) return;
            idlePlayers.push({
                id: client.id,
                nickname: client.getNickname(),
                isBot: false,
                lang: client.getAuthInfo().lang
            });
        })

        this.matches.forEach(match => {
            const player1 = match.getPlayer(PlayerTag.Player1);
            const player2 = match.getPlayer(PlayerTag.Player2);
            if (!player1 || !player2) return;

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
        })
    }

    sendLobbyStatsToClient(client: Client) {
        client.send('game:stats', this.getStats());
    }

    sendMapToEditor(client: Client, mapId: number) {
        if (mapId >= 0 && mapId < Maps.length) {
            client.send('game:map', {
                id: mapId,
                map: Maps[mapId]
            })
        }
    }

    spectateMatchByClient(client: Client, matchId: string) {
        if (!this.matches.hasId(matchId)) return;
        const match = this.matches.getById(matchId);
        match.addSpectator(client);
    }

    removeSpectator(client) {
        const match = client.getMatch();
        if (match) match.removeSpectator(client);
    }

    async reloadClientProfiles() {
        if (!this.clients.count()) { return; }
        const promises: Promise<void>[] = [];
        this.clients.forEach(client => promises.push(client.getProfile().reload()));
        return await Promise.all(promises);
    }

    async resetPointsDaily() {
        await ProfileModel.resetScore('today');
        await this.reloadClientProfiles();
    }

    async resetPointsMonthly() {
        await ProfileModel.resetScore('month');
        await this.reloadClientProfiles();
    }

    async killZombieMatches() {
        this.matches.forEach(match => {
            let hasAlivePlayers = false;
            match.forEachPlayer(player => {
                if (!player) return;
                if (player.isBot()) return;
                if (!player.isConnected()) return;
                hasAlivePlayers = true;
            });
            if (!hasAlivePlayers || match.getPlayersCount() != 2) {
                console.log(`killed match: ${match.id}`);
                match.terminate();
            }
        })
    }

    cancelInvite(inviter: Client) {
        if (inviter.id in this.invites) {
            const invited = this.clients.getById(this.invites[inviter.id]);
            if (invited) {
                invited.send('game:invite-cancel');
            }
            delete this.invites[inviter.id];
        }
    }

    sendPlayInvite(inviter: Client, opponentId: string) {
        inviter.clearBlacklist();

        const opponent = this.clients.getById(opponentId);
        if (!opponent || !opponent.isConnected()) {
            return inviter.send('game:invite-response', {
                isAccepted: false,
                message: 'not-found'
            })
        }

        if (opponent.isInGameWithHuman()) {
            return inviter.send('game:invite-response', {
                isAccepted: false,
                message: 'busy'
            })
        }

        if (opponent.isBlacklisted(inviter.id)) {
            return inviter.send('game:invite-response', {
                isAccepted: false,
            })
        }

        this.invites[inviter.id] = opponentId;
        opponent.send('game:invite-request', {
            playerId: inviter.id,
            nickname: inviter.getNickname()
        });
    }

    sendPlayInviteResponse(invited: Client, inviterId: string, isAccepted: boolean) {
        if (!isAccepted) {
            invited.addToBlacklist(inviterId);
        }

        const inviter = this.clients.getById(inviterId);
        if (!inviter || !inviter.isConnected()) {
            if (isAccepted) invited.send('game:invite-expired');
            return;
        }
        if (!(inviterId in this.invites) || this.invites[inviterId] != invited.id) {
            if (isAccepted) invited.send('game:invite-expired');
            return;
        }

        delete this.invites[inviterId];

        if (!isAccepted) {
            inviter.send('game:invite-response', {
                isAccepted: false,
                message: 'rejected'
            })

            if (Object.values(this.invites).includes(invited.id)) {
                let isNextInviteFound = false;
                Object.keys(this.invites).forEach(inviterId => {
                    if (!isNextInviteFound && this.invites[inviterId] === invited.id) {
                        const inviter = this.clients.getById(inviterId);
                        this.sendPlayInvite(inviter, invited.id);
                    }
                })
            }

            return;
        }

        inviter.send('game:invite-response', {
            isAccepted: true,
            message: 'accepted'
        })

        if (Object.values(this.invites).includes(invited.id)) {
            Object.keys(this.invites).forEach(inviterId => {
                if (this.invites[inviterId] === invited.id) {
                    const inviter = this.clients.getById(inviterId);
                    this.cancelInvite(inviter);
                }
            })
        }

        const invitedCurrentMatch = invited.getMatch();
        if (invitedCurrentMatch) {
            if (invitedCurrentMatch.hasSpectator(invited)) {
                invitedCurrentMatch.removeSpectator(invited);
            } else {
                invitedCurrentMatch.removePlayer(invited);
            }
        }

        this.createMatch(inviter, invited);
    }
}