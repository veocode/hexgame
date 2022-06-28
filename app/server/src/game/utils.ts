import { randomBytes } from "crypto";

export function generateId(): string {
    return randomBytes(3 * 4).toString('base64');
}

interface HasId {
    id: string
}

export class List<T extends HasId> {

    private items: { [id: string]: T } = {};

    add(item: T) {
        this.items[item.id] = item;
    }

    remove(item: T): boolean {
        if (item.id in this.items) {
            delete this.items[item.id];
            return true;
        }
        return false;
    }

    hasId(id: string): boolean {
        return id in this.items;
    }

    includes(item: T): boolean {
        return this.hasId(item.id);
    }

    getById(id: string): T {
        return this.items[id];
    }

    count() {
        return Object.keys(this.items).length;
    }

    forEach(callback: (item: T) => void) {
        Object.values(this.items).forEach(item => {
            callback(item);
        })
    }

    forEachExcept(exceptItem: T, callback: (item: T) => void) {
        Object.values(this.items).forEach(item => {
            if (item.id === exceptItem.id) return;
            callback(item);
        })
    }

    toArray(): T[] {
        return Object.values(this.items);
    }

}
