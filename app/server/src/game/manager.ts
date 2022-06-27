import { Client, ClientList } from "../client/client";
import { GameMatch, MatchScoreList } from "./match";
import { Maps } from "./maps";
import { BotClient } from "../client/botclient";
import { PlayerTag } from "../shared/types";
import { Profile } from "../client/profile";

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
    private matches: { [key: string]: GameMatch } = {};

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
                if (client.getOpponent()) {
                    const remainingPlayer = activeMatch.getPlayer(client.getOpponent().getTag());
                    if (remainingPlayer?.isBot()) {
                        activeMatch.terminate();
                    }
                }
            }
        }

        this.sendStatsToAdmins();
    }

    bindClientEvents(client: Client) {
        client.on('game:search-request', () => {
            this.searchGameForClient(client);
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

    createMatch(player1: Client, player2: Client) {
        const match = new GameMatch(this.getRandomMap());

        player1.setOpponent(player2);
        player1.setMatch(match);

        player2.setOpponent(player1);
        player2.setMatch(match);

        match.addPlayer(player1);
        match.addPlayer(player2);
        match.start();

        match.whenOver((scores: MatchScoreList | null) => {
            if (scores) {
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
        this.matches[match.id] = match;
        this.sendStatsToAdmins();
    }

    removeMatch(match: GameMatch) {
        if (match.id in this.matches) {
            delete this.matches[match.id];
        }
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

        Object.values(this.matches).forEach(match => {
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
        if (!(matchId in this.matches)) return;
        const match = this.matches[matchId];
        match.addSpectator(client);
    }
}