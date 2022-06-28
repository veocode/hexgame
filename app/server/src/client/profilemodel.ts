import { Schema, model, Model, HydratedDocument, SortOrder } from 'mongoose';
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
    cityId?: number;
    countryId?: number;
    createdAt?: Date;
    visitedAt?: Date;
}

export interface IProfileMethods {
    getFullName(): string;
    updateVisitedAt(): void;
    addScore(points: number): void;
    reload(): Promise<void>;
}

export interface IProfileModelMethods extends Model<IProfile, {}, IProfileMethods> {
    getBySourceId(sourceId: string): Promise<ProfileModelType>;
    getOrCreateByAuthInfo(authInfo: AuthInfo): Promise<ProfileModelType>;
    getTopPlayers(period: string, count: number): Promise<ProfileModelType[]>;
    resetScore(period: string): Promise<void>;
}

const schema = new Schema<IProfile, IProfileModelMethods, IProfileMethods>({
    sourceId: { type: String, required: true },
    nickname: { type: String, default: 'unnamed' },
    name: { type: String, default: 'unnamed' },
    avatarUrl: { type: String },
    cityId: { type: Number, default: 0 },
    countryId: { type: Number, default: 0 },
    score: {
        total: { type: Number, default: 0 },
        today: { type: Number, default: 0 },
        week: { type: Number, default: 0 },
        month: { type: Number, default: 0 },
    },
    createdAt: { type: Date, default: Date.now },
    visitedAt: { type: Date, default: Date.now }
});

schema.statics.getBySourceId = async function (sourceId: string): Promise<ProfileModelType> {
    const result = await ProfileModel.findOne({ sourceId }).exec();
    return result;
}

schema.statics.getOrCreateByAuthInfo = async function (authInfo: AuthInfo): Promise<ProfileModelType> {
    let profile = await this.getBySourceId(authInfo.sourceId);
    if (profile !== null) return profile;

    profile = new this({ ...authInfo });

    await profile.save();
    return profile;
}

schema.statics.getTopPlayers = async function (period: string, count: number): Promise<ProfileModelType[]> {
    const sortDict: { [key: string]: SortOrder } = {};
    sortDict[`score.${period}`] = -1;
    return await this.find({ sourceId: { $ne: 'bot' } }).sort(sortDict).limit(count).exec();
}

schema.statics.resetScore = async function (period: string): Promise<void> {
    const updateDict: { [key: string]: any } = { $set: {} };
    updateDict.$set[`score.${period}`] = 0;
    await this.updateMany({}, updateDict, { multi: true }).exec();
}

schema.methods.getFullName = function (): string {
    return this.firstName + ' ' + this.lastName;
}

schema.methods.updateVisitedAt = async function () {
    this.visitedAt = new Date();
    await this.save();
}

schema.methods.addScore = async function (points: number) {
    this.score.total = Math.max(this.score.total + points, 0);
    this.score.today = Math.max(this.score.today + points, 0)
    this.score.week = Math.max(this.score.week + points, 0)
    this.score.month = Math.max(this.score.month + points, 0)
    await this.save();
}

schema.methods.reload = async function () {
    const record = await this.constructor.findById(this);
    Object.assign(this, record);
    console.log('reloaded profile: ', this.nickname);
}

export type ProfileModelType = HydratedDocument<IProfile, IProfileMethods>;

export const ProfileModel = model<IProfile, IProfileModelMethods, IProfileMethods>('ProfileModel', schema);
