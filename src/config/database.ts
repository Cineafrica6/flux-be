import mongoose from 'mongoose';
import { env } from './environment.js';

export const connectDatabase = async (): Promise<void> => {
    try {
        await mongoose.connect(env.MONGODB_URI);
        console.log('✅ Connected to MongoDB');
    } catch (error) {
        console.error('❌ MongoDB connection error:', error);
        process.exit(1);
    }
};

mongoose.connection.on('disconnected', () => {
    console.warn('⚠️ MongoDB disconnected. Attempting to reconnect...');
});

mongoose.connection.on('error', (err) => {
    console.error('❌ MongoDB error:', err);
});
