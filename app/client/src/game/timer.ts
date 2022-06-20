export default class Timer {

    private timeoutId: NodeJS.Timeout | null = null;

    private maxSeconds: number = 0
    private secondsElapsed: number = 0;

    private tickCallback: (() => void) | null = null
    private doneCallback: (() => void) | null = null

    private scheduleTick() {
        this.timeoutId = setTimeout(() => this.tick(), 1000);
    }

    private tick() {
        this.secondsElapsed += 1;
        if (this.tickCallback) this.tickCallback();

        if (this.secondsElapsed === this.maxSeconds) {
            if (this.doneCallback) this.doneCallback();
            return;
        }

        this.scheduleTick();
    }

    onTick(callback: () => void) {
        this.tickCallback = callback;
    }

    onDone(callback: () => void) {
        this.doneCallback = callback;
    }

    start(maxSeconds: number, tickCallback: (() => void) | null = null) {
        this.stop();
        this.maxSeconds = maxSeconds;
        this.secondsElapsed = 0;
        if (this.maxSeconds) this.scheduleTick();
        if (tickCallback) this.onTick(tickCallback);
    }

    stop() {
        if (this.timeoutId) {
            clearTimeout(this.timeoutId);
            this.timeoutId = null;
        }
    }

    reset() {
        this.secondsElapsed = 0;
    }

    formatElapsed(text: string) {
        return `${text} (${this.secondsElapsed})`;
    }

    formatLeft(text: string) {
        const secondsLeft = this.maxSeconds - this.secondsElapsed;
        return `${text} (${secondsLeft})`;
    }
}