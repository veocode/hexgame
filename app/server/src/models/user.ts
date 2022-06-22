import { Schema, model, Model, HydratedDocument } from 'mongoose';

interface IUser {
    externalId: string,
    firstName?: string,
    lastName?: string,
    avatarUrl?: string,
    rating?: number,
    createdAt?: Date,
    visitedAt?: Date
}

interface IUserMethods {
    getFullName(): string;
}

interface IUserModel extends Model<IUser, {}, IUserMethods> {
    getByExternalId(externalId: string): Promise<HydratedDocument<IUser, IUserMethods>>;
}

const schema = new Schema<IUser, IUserModel, IUserMethods>({
    externalId: { type: String, required: true },
    firstName: { type: String },
    lastName: { type: String },
    avatarUrl: { type: String },
    rating: { type: Number },
    createdAt: { type: Date, default: Date.now },
    visitedAt: { type: Date, default: Date.now }
});

schema.static('getByExternalId', async function getByExternalId(externalId: string) {
    return await User.findOne({ externalId }).exec();
});

schema.static('getOrCreateByExternalId', async function getOrCreateByExternalId(externalId: string) {
    let user = await this.getByExternalId(externalId);
    if (user) return user;

    user = new this({
        externalId
    });

    await user.save();
    return user;
});

schema.method('getFullName', function getFullName(): string {
    return this.firstName + ' ' + this.lastName;
});

export const User = model<IUser>('User', schema);
