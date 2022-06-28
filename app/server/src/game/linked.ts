import { Client, ClientList } from "../client/client";
import { Config } from "../config";
import { generateId } from "./utils";

type LinkedGameCancelledCallback = () => void;
type LinkedGameReadyCallback = (clients: Client[]) => void;

export class LinkedGame {

    public readonly id: string;

    protected clients: ClientList = new ClientList();

    protected callbacks: {
        Cancelled?: LinkedGameCancelledCallback | null,
        Ready?: LinkedGameReadyCallback | null,
    } = {};

    constructor(public readonly clientsToStart: number = 2) {
        this.id = generateId();
    }

    getUrl(): string {
        return `${Config.host}/?g=${encodeURI(this.id)}`;
    }

    addClient(client: Client) {
        this.clients.add(client);

        if (this.clients.count() === this.clientsToStart) {
            if (this.callbacks.Ready) this.callbacks.Ready(this.clients.toArray());
        }
    }

    removeClient(client: Client) {
        if (this.clients.remove(client) && this.clients.count() === 0) {
            if (this.callbacks.Cancelled) this.callbacks.Cancelled();
        }
    }

    whenCancelled(callback: LinkedGameCancelledCallback) {
        this.callbacks.Cancelled = callback;
    }

    whenReady(callback: LinkedGameReadyCallback) {
        this.callbacks.Ready = callback;
    }

}