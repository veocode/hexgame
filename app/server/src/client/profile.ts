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

    constructor(public readonly authInfo: AuthInfo) {
        this.getModelByAuthInfo(this.authInfo).then(model => {
            if (model) {
                this.nickname = authInfo.nickname;

                this.model = model;
                this.model.visitedAt = new Date();

                if (authInfo.sourceId !== 'bot') {
                    this.model.nickname = this.authInfo.nickname;
                    this.model.name = this.authInfo.name ? this.authInfo.name : this.authInfo.nickname;
                }

                this.model.save();
            }
        });
    }

    static async createAndLoad(authInfo: AuthInfo) {
        return new Profile(authInfo);
    }

    private async getModelByAuthInfo(authInfo: AuthInfo) {
        return await ProfileModel.getOrCreateByAuthInfo(authInfo);
    }

    async addScore(points: number) {
        await this.model.addScore(points);
    }

    getScore(): ProfileScoreDict {
        return this.model.score;
    }

    getTotalScore(): number {
        return this.model.score.total || 0;
    }

}