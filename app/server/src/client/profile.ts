import { Model } from "mongoose";
import { AuthInfo } from "./authinfo";
import { IProfile, ProfileModel } from "./profilemodel";

type OptionalProfileModel = Model<IProfile> | null;

export class Profile {

    private model: OptionalProfileModel = null;

    async load(authInfo: AuthInfo) {
        this.model = await this.getModelByAuthInfo(authInfo);
        if (this.model) this.model['updateVisitedAt']();
    }

    private async getModelByAuthInfo(authInfo: AuthInfo) {
        return await ProfileModel['getOrCreateByAuthInfo'](authInfo);
    }

}