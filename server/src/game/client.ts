import { Socket } from "socket.io";

export class ClientList {

    private clients: { [key: string]: Client } = {};

    add(client: Client) {
        this.clients[client.id] = client;
    }

    remove(client: Client) {
        delete this.clients[client.id];
    }

    includes(client: Client) {
        return client.id in this.clients;
    }

    count() {
        return Object.keys(this.clients).length;
    }

    forEachExcept(exceptClient: Client, callback: (client: Client) => void) {
        Object.values(this.clients).forEach(client => {
            if (client.id === exceptClient.id) return;
            callback(client);
        })
    }

}

export enum ClientState {
    Idle = 0,
    SearchingGame,
    InGame,
}

export class Client {

    public readonly id: string;
    private tag: number = 0;
    private opponent: Client;
    private state: ClientState = ClientState.Idle;

    constructor(private readonly socket: Socket) {
        this.id = socket.id;
    }

    getTag(): number {
        return this.tag;
    }

    setTag(tag: number) {
        this.tag = tag;
    }

    getOpponent(): Client {
        return this.opponent;
    }

    setOpponent(client: Client) {
        this.setInGame();
        this.opponent = client;
    }

    on(eventName: string, callback: (...args: any[]) => void) {
        this.socket.on(eventName, callback);
    }

    off(eventName: string) {
        this.socket.removeAllListeners(eventName);
    }

    send(eventName, ...args: any[]) {
        this.socket.emit(eventName, ...args);
    }

    setIdle() {
        this.state = ClientState.Idle;
    }

    isIdle(): boolean {
        return this.state === ClientState.Idle;
    }

    setSearchingGame() {
        this.state = ClientState.SearchingGame;
    }

    isSearchingGame(): boolean {
        return this.state === ClientState.SearchingGame;
    }

    setInGame() {
        this.state = ClientState.InGame;
    }

    isInGame(): boolean {
        return this.state === ClientState.InGame;
    }

}