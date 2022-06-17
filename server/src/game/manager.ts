import { Client, ClientList } from "./client";
import { GameMatch } from "./match";
import { Maps } from "./maps";
import { BotClient } from "./botclient";

interface ServerStats {
    players: number,
    bots: number,
    admins: number,
    matches: number
}

export class GameManager {

    private admins: ClientList = new ClientList;
    private clients: ClientList = new ClientList;
    private matches: GameMatch[] = [];

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
                    if (remainingPlayer && remainingPlayer.isBot()) {
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
                const botOpponent = new BotClient(null);
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
        this.matches.push(match);
        this.sendStatsToAdmins();
    }

    removeMatch(match: GameMatch) {
        const index = this.matches.indexOf(match);
        if (index >= 0) this.matches.splice(index);
        this.sendStatsToAdmins();
    }

    getStats(): ServerStats {
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
        })
    }

    sendStatsToAdmin(admin: Client) {
        if (!admin.isAdmin()) return;
        admin.send('game:stats', this.getStats());
    }

    private getRandomMap(): number[] {
        return Maps[Math.floor(Math.random() * Maps.length)];
    }
}