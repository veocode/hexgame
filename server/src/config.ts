const env = (name, defaultValue) => {
    defaultValue = defaultValue || false;
    return process.env[name] || defaultValue;
}

export const Config = {
    sockets: {
        port: env('SOCKET_PORT', 3010),
        corsOrigin: env('SOCKET_CORS_ORIGIN', '*'),
    },
}