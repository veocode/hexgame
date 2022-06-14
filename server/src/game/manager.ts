import { Client, ClientList } from "./client";
import { GameMatch } from "./match";
import { Maps } from "./maps";
import { BotClient } from "./botclient";

export class GameManager {

    private clients: ClientList = new ClientList;
    private matches: GameMatch[] = [];

    addClient(client: Client) {
        this.clients.add(client);
        this.bindClientEvents(client);
        console.log(`Client connected: ${client.nickname}, Players Online: ${this.clients.count()}`)
    }

    removeClient(client: Client) {
        this.clients.remove(client);
        console.log(`Client left: ${client.nickname}, Players Online: ${this.clients.count()}`)

        const activeMatch = client.getMatch();
        if (activeMatch) {
            activeMatch.removePlayer(client);
        }
    }

    bindClientEvents(client: Client) {
        client.on('game:search-request', () => {
            this.searchGameForClient(client);
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
    }

    removeMatch(match: GameMatch) {
        const index = this.matches.indexOf(match);
        if (index >= 0) this.matches.splice(index);
    }

    private getRandomMap(): number[] {
        return Maps[Math.floor(Math.random() * Maps.length)];
    }
}