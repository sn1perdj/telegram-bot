import winston from 'winston';
import path from 'path';
import fs from 'fs';
import { config } from '../config';

const logDir = path.resolve(process.cwd(), config.logDir);
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

const logFormat = winston.format.printf(({ timestamp, level, message, ...meta }) => {
  const metaStr = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
  return `${timestamp} [${level.toUpperCase()}]${metaStr} ${message}`;
});

const consoleFormat = winston.format.printf(({ timestamp, level, message }) => {
  return `${timestamp} [${level.toUpperCase()}] ${message}`;
});

export const logger = winston.createLogger({
  level: process.env['LOG_LEVEL'] || 'info',
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    logFormat,
  ),
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        consoleFormat,
      ),
      level: 'warn',
    }),
    new winston.transports.File({
      filename: path.join(logDir, 'bot.log'),
      maxsize: 5_242_880,
      maxFiles: 5,
    }),
  ],
});

export function logChatInteraction(
  userId: number,
  chatId: number,
  action: string,
  type: 'command' | 'callback',
  username?: string,
  firstName?: string,
): void {
  logger.info('chat_interaction', {
    userId,
    chatId,
    action,
    type,
    user: username || firstName || '',
  });
}