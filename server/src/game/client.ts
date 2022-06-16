import { Socket } from "socket.io";
import { GameMatch } from "./match";

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
    public readonly nickname: string;

    protected tag: number = 0;
    protected state: ClientState = ClientState.Idle;

    protected opponent: Client;
    protected match: GameMatch;

    protected turnTimeout: NodeJS.Timeout | null;
    protected missedTurnsCount: number = 0;

    constructor(private readonly socket: Socket | null) {
        this.id = socket
            ? socket.id
            : this.getId();
        this.nickname = socket
            ? socket.handshake.auth.nickname
            : this.getNickname();
    }

    isBot(): boolean {
        return false;
    }

    getId(): string {
        return this.id;
    }

    getNickname(): string {
        return this.nickname;
    }

    getTag(): number {
        return this.tag;
    }

    setTag(tag: number) {
        this.tag = tag;
    }

    getOpponent(): Client | null {
        return this.opponent;
    }

    setOpponent(client: Client | null) {
        if (client) this.setInGame();
        this.opponent = client;
    }

    getMatch(): GameMatch | null {
        return this.match;
    }

    setMatch(match: GameMatch | null) {
        this.match = match;
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

    disconnect() {
        this.socket.disconnect();
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

    setTurnTimeout(callback: () => void, ms: number = 10000) {
        this.stopTurnTimeout();
        this.turnTimeout = setTimeout(() => callback(), ms);
    }

    stopTurnTimeout() {
        if (this.turnTimeout) clearTimeout(this.turnTimeout);
        this.turnTimeout = null;
    }

    resetMissedTurns() {
        this.missedTurnsCount = 0;
    }

    addMissedTurn() {
        this.missedTurnsCount += 1;
    }

    getMissedTurns(): number {
        return this.missedTurnsCount;
    }

}