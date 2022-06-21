import { Client, ClientList } from "./client";
import { GameMatch } from "./match";
import { Maps } from "./maps";
import { BotClient } from "./botclient";
import { PlayerTag } from "../shared/player";

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

    addClient(client: Client) {
        this.clients.add(client);
        if (client.isAdmin()) this.admins.add(client);

        this.bindClientEvents(client);
        this.sendStatsToAdmins();
    }

    removeClient(client: Client) {
        if (client.isAdmin()) this.admins.remove(client);

        if (this.clients.remove(client)) {
            console.log('client remove');
            const activeMatch = client.getMatch();
            if (activeMatch) {
                console.log('activeMatch found');
                activeMatch.removePlayer(client);
                if (client.getOpponent()) {
                    const remainingPlayer = activeMatch.getPlayer(client.getOpponent().getTag());
                    if (remainingPlayer?.isBot()) {
                        console.log('activeMatch terminate');
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

        setTimeout(() => {
            if (client.isSearchingGame()) {
                client.setInGame();
                const botOpponent = new BotClient();
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

        match.whenOver(() => this.removeMatch(match));
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
                lang: client.lang
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

    private getRandomMap(): number[] {
        return Maps[Math.floor(Math.random() * Maps.length)];
    }

    spectateMatchByClient(client: Client, matchId: string) {
        if (!(matchId in this.matches)) return;
        const match = this.matches[matchId];
        match.addSpectator(client);
    }
}