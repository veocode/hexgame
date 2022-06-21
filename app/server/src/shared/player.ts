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
    lang: string,
    nickname: string,
    avatarUrl?: string,
    externalId?: string
}

export class Player {

    protected tag: number = 0;
    protected isAdministrator: boolean = false;
    protected info: PlayerInfo;

    constructor() {
        this.info = {
            nickname: 'guest-' + (Math.floor(Math.random() * 90000) + 10000),
            lang: '??'
        }
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