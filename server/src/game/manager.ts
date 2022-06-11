import { Client, ClientList } from "./client";
import { GameMatch } from "./match";

export class GameManager {

    private clients: ClientList = new ClientList;

    addClient(client: Client) {
        this.clients.add(client);
        this.bindClientEvents(client);
        console.log(`Client connected: ${client.nickname}, Players Online: ${this.clients.count()}`)
    }

    removeClient(client: Client) {
        this.clients.remove(client);
        console.log(`Client left: ${client.nickname}, Players Online: ${this.clients.count()}`)
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
            console.log(`Found Opponent: ${opponentClient.nickname} for client ${client.nickname}`);

            client.setOpponent(opponentClient);
            opponentClient.setOpponent(client);

            const match = new GameMatch();
            match.addPlayer(client);
            match.addPlayer(opponentClient);
            match.start();
        }
    }

}