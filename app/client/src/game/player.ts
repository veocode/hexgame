export type PlayerAuthInfo = {
    sourceId: string | null,
    lang: string,
    nickname: string,
    name?: string,
    avatarUrl?: string,
}

export class Player {

    protected tag: number = 0;
    protected isAdministrator: boolean = false;

    constructor(public readonly authInfo: PlayerAuthInfo) { }

    isGuest(): boolean {
        return this.authInfo.sourceId?.startsWith('g-') || true;
    }

    isAdmin(): boolean {
        return this.isAdministrator;
    }

    setAdmin() {
        this.isAdministrator = true;
    }

}