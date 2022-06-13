import { Client, ClientList } from "./client";
import { GameMatch } from "./match";
import { Maps } from "./maps";

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
            const match = new GameMatch(this.getRandomMap());

            client.setOpponent(opponentClient);
            client.setMatch(match);

            opponentClient.setOpponent(client);
            opponentClient.setMatch(match);

            match.addPlayer(client);
            match.addPlayer(opponentClient);
            match.start();

            match.whenOver(() => this.removeMatch(match));
            this.addMatch(match);
        }
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