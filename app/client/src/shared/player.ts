export enum PlayerHasNoMovesReasons {
    Left = 'left',
    Eliminated = 'eliminated',
    NoMoves = 'no-moves'
}

export enum PlayerTag {
    Player1 = 1,
    Player2 = 2,
}

export type PlayerColorsList = { [key: number]: string }

export type PlayerInfo = {
    nickname: string,
    avatarUrl?: string,
    externalId?: string
}

export class Player {

    protected tag: number = 0;
    protected isAdministrator: boolean = false;

    constructor(public info: PlayerInfo) { }

    isGuest(): boolean {
        return !this.info.externalId;
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

    setInfo(info: PlayerInfo) {
        this.info = info;
    }

    getInfo(): PlayerInfo {
        return this.info;
    }

}