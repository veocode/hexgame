export enum VkEvent {
    AppInit = 'VKWebAppInit',
    GetUserInfo = 'VKWebAppGetUserInfo',
    GetUserInfoResult = 'VKWebAppGetUserInfoResult'
}

export type VkUserInfo = {
    id: number,
    cityId: number,
    countryId: number,
    firstName: string,
    lastName: string,
    avatarUrl: string
}