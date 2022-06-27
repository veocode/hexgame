class Logger {

    date(): string {
        return (new Date()).toLocaleString();
    }

    log(...args: any[]) {
        console.log(`[${this.date()}]`, ...args);
    }

    error(...args: any[]) {
        console.error(`[${this.date()}]`, '[ERROR]', ...args);
    }

}

export const logger = new Logger();