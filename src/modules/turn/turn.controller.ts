import { Request, Response } from 'express';
import { logger } from '../../shared/utils/logger.js';

// Fallback STUN config (no TURN - will fail across NAT)
const FALLBACK_ICE_SERVERS = {
    iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
        { urls: 'stun:stun.cloudflare.com:3478' },
    ],
};

export const turnController = {
    async getCredentials(req: Request, res: Response) {
        // Read env vars at request time (ensures dotenv has loaded)
        const TURN_KEY_ID = process.env.CLOUDFLARE_TURN_KEY_ID;
        const TURN_API_TOKEN = process.env.CLOUDFLARE_TURN_API_TOKEN;

        logger.info('TURN credentials requested', {
            hasKeyId: !!TURN_KEY_ID,
            hasToken: !!TURN_API_TOKEN,
            keyIdPrefix: TURN_KEY_ID?.substring(0, 8) || 'none'
        });

        if (!TURN_KEY_ID || !TURN_API_TOKEN) {
            logger.warn('TURN credentials not configured in environment');
            return res.json(FALLBACK_ICE_SERVERS);
        }

        try {
            const url = `https://rtc.live.cloudflare.com/v1/turn/keys/${TURN_KEY_ID}/credentials/generate`;
            logger.debug('Calling Cloudflare TURN API', { url });

            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${TURN_API_TOKEN}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ ttl: 86400 }), // 24 hours
            });

            const responseText = await response.text();
            logger.info('Cloudflare API response', {
                status: response.status,
                body: responseText.substring(0, 500)
            });

            if (!response.ok) {
                throw new Error(`Cloudflare API returned ${response.status}: ${responseText}`);
            }

            const data = JSON.parse(responseText);

            // Validate the response has iceServers array
            if (!data.iceServers || !Array.isArray(data.iceServers) || data.iceServers.length === 0) {
                logger.warn('Cloudflare returned invalid iceServers, using fallback', { data });
                return res.json(FALLBACK_ICE_SERVERS);
            }

            logger.info('Generated TURN credentials successfully', {
                serverCount: data.iceServers.length
            });

            res.json(data);
        } catch (error) {
            logger.error('Failed to get TURN credentials', { error });
            res.json(FALLBACK_ICE_SERVERS);
        }
    },
};
