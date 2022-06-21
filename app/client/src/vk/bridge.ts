import bridge, { RequestPropsMap } from '@vkontakte/vk-bridge';
import { VkEvent, VkUserInfo } from './types';

type VkEventCallback = (result: any) => void;

type VkEventCallbackList = {
    [methodName: string]: VkEventCallback[]
}

export class VkBridge {

    public static readonly queryParams = new URLSearchParams(window.location.search);

    private callbacks: VkEventCallbackList = {};

    constructor() {
        bridge.send(VkEvent.AppInit, {});
        bridge.subscribe((event: any) => {
            this.resolveEvent(event.detail.type, event.detail.data ?? {})
        })
    }

    isDetected(): boolean {
        return VkBridge.queryParams.get('viewer_id') !== null;
    }

    async getUserInfo(): Promise<VkUserInfo> {
        const info = await this.send(VkEvent.GetUserInfo, VkEvent.GetUserInfoResult);
        return {
            id: info.id,
            cityId: info.city.id,
            countryId: info.country.id,
            firstName: info.first_name,
            lastName: info.last_name,
            avatarUrl: info.photo_100
        }
    }

    protected resolveEvent(eventName: VkEvent, data: any = {}) {
        if (eventName in this.callbacks) {
            this.callbacks[eventName].forEach(resolve => resolve(data));
            this.callbacks[eventName] = [];
        }
    }

    protected addResolver(eventName: VkEvent, resolver: VkEventCallback) {
        if (!(eventName in this.callbacks)) {
            this.callbacks[eventName] = [];
        }
        this.callbacks[eventName].push(resolver);
    }

    protected send(eventName: VkEvent, resultEventName: VkEvent, props: any = {}): Promise<any> {
        return new Promise<any>(resolve => {
            this.addResolver(resultEventName, resolve);
            bridge.send(eventName as keyof RequestPropsMap, props);
        });
    }
}