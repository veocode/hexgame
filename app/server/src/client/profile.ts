import { AuthInfo } from "./authinfo";
import { ProfileModel, ProfileModelType } from "./profilemodel";

type OptionalProfileModel = ProfileModelType | null;

export type ProfileScoreDict = {
    total: number,
    today: number,
}

export class Profile {

    private model: OptionalProfileModel = null;

    public nickname: string = '';

    constructor(public readonly authInfo: AuthInfo) { }

    async load() {
        const model = await this.getModelByAuthInfo(this.authInfo);
        this.nickname = this.authInfo.nickname;

        this.model = model;
        this.model.visitedAt = new Date();

        if (this.authInfo.sourceId !== 'bot') {
            this.model.nickname = this.authInfo.nickname;
            this.model.name = this.authInfo.name ? this.authInfo.name : this.authInfo.nickname;
        }

        this.model.save();
    }

    static async createAndLoad(authInfo: AuthInfo) {
        const profile = new Profile(authInfo);
        await profile.load();
        return profile;
    }

    private async getModelByAuthInfo(authInfo: AuthInfo) {
        return await ProfileModel.getOrCreateByAuthInfo(authInfo);
    }

    async addScore(points: number) {
        await this.model.addScore(points);
    }

    getScore(): ProfileScoreDict {
        return this.model ? this.model.score : {
            total: 0,
            today: 0
        };
    }

    getTotalScore(): number {
        return this.model.score.total || 0;
    }

}