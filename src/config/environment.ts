import { z } from 'zod';
import dotenv from 'dotenv';

dotenv.config();

const envSchema = z.object({
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
    PORT: z.string().transform(Number).default('3001'),
    MONGODB_URI: z.string().url().default('mongodb://localhost:27017/fluxxx'),
    CORS_ORIGIN: z.string().default('http://localhost:3000'),
    SOCKET_PATH: z.string().default('/socket.io'),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
    console.error('❌ Invalid environment variables:', parsed.error.flatten().fieldErrors);
    process.exit(1);
}

export const env = parsed.data;
