import { Context, SessionFlavor } from 'grammy';

export interface SessionData {
  lastMessageId?: number;
  chatId?: number;
  notificationsEnabled?: boolean;
}

export type BotContext = Context & SessionFlavor<SessionData>;