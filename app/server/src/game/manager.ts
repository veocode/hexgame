import { Client, ClientList } from "../client/client";
import { GameMatch, MatchScoreList } from "./match";
import { Maps } from "./maps";
import { BotClient } from "../client/botclient";
import { PlayerTag } from "../shared/types";
import { Profile } from "../client/profile";
import { ProfileModel } from "../client/profilemodel";
import { LinkedGame } from "./linked";
import { List } from "./utils";

interface ServerPlayerDescription {
    nickname: string,
    lang: string
}

interface ServerMatchDescription {
    id: string,
    player1: string,
    player2: string
}

interface ServerStats {
    bots: number,
    players: {
        count: number,
        list: ServerPlayerDescription[]
    },
    admins: {
        count: number,
        list: string[]
    },
    matches: {
        count: number,
        list: ServerMatchDescription[]
    }
}

export class GameManager {

    private admins: ClientList = new ClientList;
    private clients: ClientList = new ClientList;
    private matches: List<GameMatch> = new List<GameMatch>();

    private linkedGames: List<LinkedGame> = new List<LinkedGame>();

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
        this.sendStatsToAdmins();
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

        this.sendStatsToAdmins();
    }

    bindClientEvents(client: Client) {
        client.on('game:search-request', () => {
            this.searchGameForClient(client);
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
            if (!client.isAdmin()) return;
            this.sendStatsToAdmin(client);
        })

        client.on('game:maps', () => {
            if (!client.isAdmin()) return;
            client.send('game:maps', { count: Maps.length });
        })

        client.on('game:map-request', ({ id }) => {
            if (!client.isAdmin()) return;
            this.sendMapToEditor(client, id);
        })

        client.on('game:spectate-request', ({ matchId }) => {
            this.spectateMatchByClient(client, matchId);
        });

        client.on('game:spectate-stop', () => {
            this.removeSpectator(client);
        });
    }

    searchGameForClient(client: Client) {
        client.setSearchingGame();

        let opponentClient: Client;
        this.clients.forEachExcept(client, otherClient => {
            if (opponentClient || !otherClient.isSearchingGame()) return;
            opponentClient = otherClient;
        });

        if (opponentClient) {
            return this.createMatch(client, opponentClient);
        }

        setTimeout(async () => {
            if (client.isConnected() && client.isSearchingGame()) {
                client.setInGame();

                const botProfile = await Profile.createAndLoad({
                    sourceId: 'bot',
                    nickname: BotClient.getRandomName(),
                    lang: '??'
                })

                const botOpponent = new BotClient(botProfile);
                this.createMatch(client, botOpponent);
            }
        }, 3000);
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

    createMatch(player1: Client, player2: Client, linkedGame: LinkedGame | null = null) {
        const match = new GameMatch(this.getRandomMap());

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
                        player.getProfile().addScore(points);
                    }
                })
            }
            this.removeMatch(match);
        });

        this.addMatch(match);
    }

    addMatch(match: GameMatch) {
        this.matches.add(match);
        this.sendStatsToAdmins();
    }

    removeMatch(match: GameMatch) {
        this.matches.remove(match);
        this.sendStatsToAdmins();
    }

    getStats(): ServerStats {
        let botCount = 0;
        let admins: string[] = [];
        let players: ServerPlayerDescription[] = [];
        let matches: ServerMatchDescription[] = [];

        this.clients.forEach(client => {
            if (client.isAdmin()) return admins.push(client.getNicknameWithIcon());
            players.push({
                nickname: client.getNicknameWithIcon(),
                lang: client.getAuthInfo().lang
            });
        })

        this.matches.forEach(match => {
            if (match.hasBot()) botCount++;

            matches.push({
                id: match.id,
                player1: match.getPlayer(PlayerTag.Player1)?.getNicknameWithIcon(),
                player2: match.getPlayer(PlayerTag.Player2)?.getNicknameWithIcon(false)
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
        })
    }

    sendStatsToAdmin(admin: Client) {
        if (!admin.isAdmin()) return;
        admin.send('game:stats', this.getStats());
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

    async killZombieMatches() {
        this.matches.forEach(match => {
            let hasAlivePlayers = false;
            match.forEachPlayer(player => {
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
}