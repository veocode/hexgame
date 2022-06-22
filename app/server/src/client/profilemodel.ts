import { Schema, model, Model, HydratedDocument } from 'mongoose';
import { AuthInfo } from './authinfo';

export interface IProfile {
    sourceId: string;
    nickname?: string;
    name?: string;
    avatarUrl?: string;
    score: {
        total: number;
        today: number;
    }
    createdAt?: Date;
    visitedAt?: Date;
}

export interface IProfileMethods {
    getFullName(): string;
    updateVisitedAt(): void;
}

export interface IProfileModelMethods extends Model<IProfile, {}, IProfileMethods> {
    getBySourceId(sourceId: string): Promise<HydratedDocument<IProfile, IProfileMethods>>;
    getOrCreateByAuthInfo(authInfo: AuthInfo);
}

const schema = new Schema<IProfile, IProfileModelMethods, IProfileMethods>({
    sourceId: { type: String, required: true },
    nickname: { type: String, default: 'unnamed' },
    name: { type: String, default: 'unnamed' },
    avatarUrl: { type: String },
    score: {
        total: { type: Number, default: 0 },
        day: { type: Number, default: 0 },
        week: { type: Number, default: 0 },
        month: { type: Number, default: 0 },
    },
    createdAt: { type: Date, default: Date.now },
    visitedAt: { type: Date, default: Date.now }
});

schema.statics.getBySourceId = async function (sourceId: string) {
    return await ProfileModel.findOne({ sourceId }).exec();
}

schema.statics.getOrCreateByAuthInfo = async function (authInfo: AuthInfo) {
    let profile = await this.getBySourceId(authInfo.sourceId);
    if (profile) return profile;

    profile = new this({ ...authInfo });

    await profile.save();
    return profile;
}

schema.methods.getFullName = function (): string {
    return this.firstName + ' ' + this.lastName;
}

schema.methods.updateVisitedAt = async function () {
    this.visitedAt = new Date();
    await this.save();
}

export const ProfileModel = model<IProfile>('ProfileModel', schema);
