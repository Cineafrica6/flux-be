import { Server as HttpServer } from 'http';
import { Server } from 'socket.io';
import { createSocketServer } from '../config/socket.js';
import { registerSocketHandlers } from './registerHandlers.js';

export const initializeSocket = (httpServer: HttpServer): Server => {
    const io = createSocketServer(httpServer);
    registerSocketHandlers(io);
    return io;
};

export { registerSocketHandlers };
