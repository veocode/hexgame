import { Socket } from "socket.io";
import { Player, PlayerInfo } from "../shared/player";
import { GameMatch } from "./match";

export class ClientList {

    private clients: { [key: string]: Client } = {};

    add(client: Client) {
        this.clients[client.id] = client;
    }

    remove(client: Client): boolean {
        if (client.id in this.clients) {
            delete this.clients[client.id];
            return true;
        }
        return false;
    }

    includes(client: Client) {
        return client.id in this.clients;
    }

    count() {
        return Object.keys(this.clients).length;
    }

    forEach(callback: (client: Client) => void) {
        Object.values(this.clients).forEach(client => {
            callback(client);
        })
    }

    forEachExcept(exceptClient: Client, callback: (client: Client) => void) {
        Object.values(this.clients).forEach(client => {
            if (client.id === exceptClient.id) return;
            callback(client);
        })
    }

    send(eventName, ...args: any[]) {
        this.forEach(client => client.send(eventName, ...args));
    }

    disconnect() {
        this.forEach(client => client.disconnect());
    }

}

export enum ClientState {
    Idle = 0,
    SearchingGame,
    InGame,
}

export class Client extends Player {

    public readonly id: string;

    protected state: ClientState = ClientState.Idle;

    protected opponent: Client;
    protected match: GameMatch;

    protected turnTimeout: NodeJS.Timeout | null;
    protected missedTurnsCount: number = 0;

    constructor(
        private readonly socket: Socket | null,
        public readonly info: PlayerInfo,
        public readonly lang: string = '??',
        isAdministrator: boolean = false
    ) {
        super();
        this.id = socket
            ? socket.id
            : this.getId();

        if (isAdministrator) this.setAdmin();
    }

    isBot(): boolean {
        return false;
    }

    isConnected(): boolean {
        return this.socket.connected;
    }

    getId(): string {
        return this.id;
    }

    getNickname(): string {
        return this.info.nickname;
    }

    getNicknameWithIcon(isPrepend: boolean = true): string {
        const icon = this.isBot() ? '🤖' : '👤';
        return isPrepend ? `${icon} ${this.info.nickname}` : `${this.info.nickname} ${icon}`;
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
        clearTimeout(this.turnTimeout);
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