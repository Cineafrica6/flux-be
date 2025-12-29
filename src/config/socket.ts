import { Server as HttpServer } from 'http';
import { Server, ServerOptions } from 'socket.io';
import { env } from './environment.js';

// Maximum concurrent connections to prevent memory exhaustion
const MAX_CONNECTIONS = 200;

export const createSocketServer = (httpServer: HttpServer): Server => {
    const options: Partial<ServerOptions> = {
        cors: {
            origin: env.CORS_ORIGIN.split(',').map(o => o.trim()),
            methods: ['GET', 'POST'],
            credentials: true,
        },
        path: env.SOCKET_PATH,
        transports: ['websocket', 'polling'],
        // Performance optimizations
        pingTimeout: 30000,        // Detect dead connections faster
        pingInterval: 25000,       // Keep connections alive
        upgradeTimeout: 10000,     // Faster WebSocket upgrade timeout
        maxHttpBufferSize: 1e6,    // 1MB max message size
        perMessageDeflate: true,   // Compress WebSocket messages
        httpCompression: true,     // Compress HTTP fallback
    };

    const io = new Server(httpServer, options);

    // Connection limiting middleware
    io.use((socket, next) => {
        const connectedClients = io.engine.clientsCount;
        if (connectedClients >= MAX_CONNECTIONS) {
            console.warn(`⚠️ Connection limit reached (${connectedClients}/${MAX_CONNECTIONS})`);
            return next(new Error('Server at capacity. Please try again later.'));
        }
        next();
    });

    console.log(`🔌 Socket.IO initialized at path: ${env.SOCKET_PATH}`);
    console.log(`📊 Max connections: ${MAX_CONNECTIONS}`);

    return io;
};
