import { Server as HttpServer } from 'http';
import { Server, ServerOptions } from 'socket.io';
import { env } from './environment.js';

export const createSocketServer = (httpServer: HttpServer): Server => {
    const options: Partial<ServerOptions> = {
        cors: {
            origin: env.CORS_ORIGIN,
            methods: ['GET', 'POST'],
            credentials: true,
        },
        path: env.SOCKET_PATH,
        transports: ['websocket', 'polling'],
    };

    const io = new Server(httpServer, options);

    console.log(`🔌 Socket.IO initialized at path: ${env.SOCKET_PATH}`);

    return io;
};
