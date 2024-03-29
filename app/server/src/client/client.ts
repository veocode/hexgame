import { Socket } from "socket.io";
import { PlayerTag } from "../shared/types";
import { GameMatch } from "../game/match";
import { AuthInfo } from "./authinfo";
import { Profile } from "./profile";
import { List } from "../game/utils";
import { LinkedGame } from "../game/linked";
import { BotDifficulty } from "./botclient";

export enum ClientState {
    Idle = 0,
    SearchingGame,
    InGame,
}

export class ClientList extends List<Client> {

    send(eventName, ...args: any[]) {
        this.forEach(client => client.send(eventName, ...args));
    }

    disconnect() {
        this.forEach(client => client.disconnect());
    }

}

export class Client {

    public readonly id: string;
    public linkedGame: LinkedGame | null = null;

    protected state: ClientState = ClientState.Idle;
    protected opponent: Client;
    protected match: GameMatch;

    protected tag: number = 0;
    protected isAdministrator: boolean = false;
    protected turnTimeout: NodeJS.Timeout | null;
    protected missedTurnsCount: number = 0;

    protected inviteBlacklist: string[] = [];

    constructor(
        private readonly socket: Socket | null,
        protected profile: Profile,
        isAdministrator: boolean = false
    ) {
        this.id = socket ? socket.id : this.getId();
        if (isAdministrator) this.setAdmin();
    }

    getScoreMultiplier(): number {
        return 1;
    }

    isBot(): boolean {
        return false;
    }

    isGuest(): boolean {
        return !this.isBot()
            && 'sourceId' in this.profile.authInfo
            && this.profile.authInfo.sourceId.startsWith('g-');
    }

    isConnected(): boolean {
        return this.socket.connected;
    }

    getId(): string {
        return this.id;
    }

    getProfile(): Profile {
        return this.profile;
    }

    getAuthInfo(): AuthInfo {
        return this.profile.authInfo;
    }

    getNickname(): string {
        return this.profile.nickname;
    }

    getNicknameWithIcon(isPrepend: boolean = true): string {
        const icon = this.isGuest() ? '👤' : '👨🏼‍💼';
        return isPrepend ? `${icon} ${this.profile.authInfo.nickname}` : `${this.profile.authInfo.nickname} ${icon}`;
    }

    isAdmin(): boolean {
        return this.isAdministrator;
    }

    setAdmin() {
        this.isAdministrator = true;
    }

    getTag(): number {
        return this.tag;
    }

    setTag(tag: number) {
        this.tag = tag;
    }

    getOpponentTag() {
        return this.getTag() === PlayerTag.Player1
            ? PlayerTag.Player2
            : PlayerTag.Player1;
    }

    getOpponent(): Client | null {
        return this.opponent;
    }

    setOpponent(client: Client | null) {
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
        this.socket.disconnect(true);
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

    isInGameWithHuman(): boolean {
        if (!this.isInGame()) return false;
        const opponent = this.getOpponent();
        if (!opponent) return false;
        return !opponent.isBot();
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

    addToBlacklist(clientId: string) {
        this.inviteBlacklist.push(clientId);
    }

    isBlacklisted(clientId: string): boolean {
        return this.inviteBlacklist.indexOf(clientId) >= 0;
    }

    clearBlacklist() {
        this.inviteBlacklist = [];
    }

}