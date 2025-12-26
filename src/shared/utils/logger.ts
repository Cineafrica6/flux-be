type LogLevel = 'info' | 'warn' | 'error' | 'debug';

const colors = {
    info: '\x1b[36m',   // Cyan
    warn: '\x1b[33m',   // Yellow
    error: '\x1b[31m',  // Red
    debug: '\x1b[35m',  // Magenta
    reset: '\x1b[0m',
};

const icons = {
    info: 'ℹ️',
    warn: '⚠️',
    error: '❌',
    debug: '🔍',
};

const formatMessage = (level: LogLevel, message: string, meta?: object): string => {
    const timestamp = new Date().toISOString();
    const color = colors[level];
    const icon = icons[level];
    const metaStr = meta ? ` ${JSON.stringify(meta)}` : '';
    return `${color}${timestamp} ${icon} [${level.toUpperCase()}] ${message}${metaStr}${colors.reset}`;
};

export const logger = {
    info: (message: string, meta?: object) => console.log(formatMessage('info', message, meta)),
    warn: (message: string, meta?: object) => console.warn(formatMessage('warn', message, meta)),
    error: (message: string, meta?: object) => console.error(formatMessage('error', message, meta)),
    debug: (message: string, meta?: object) => {
        if (process.env.NODE_ENV === 'development') {
            console.debug(formatMessage('debug', message, meta));
        }
    },
};
