import * as fs from 'fs';
import * as path from 'path';

interface ConversationEntry {
  timestamp: string;
  userId: number;
  username?: string;
  firstName?: string;
  chatId: number;
  received: string;
  sent: string;
  type: 'command' | 'callback';
}

export class ChatLogger {
  private logFile: string;
  private logDir: string;

  constructor(logDir: string = 'logs') {
    this.logDir = path.resolve(process.cwd(), logDir);
    this.logFile = path.join(this.logDir, 'telegram_chat.log');
    this.ensureLogDirectory();
  }

  private ensureLogDirectory(): void {
    if (!fs.existsSync(this.logDir)) {
      fs.mkdirSync(this.logDir, { recursive: true });
    }
  }

  private writeLog(entry: ConversationEntry): void {
    try {
      const logLine = JSON.stringify(entry) + '\n';
      fs.appendFileSync(this.logFile, logLine, 'utf8');
    } catch {
      // Silent fail
    }
  }

  logConversation(
    userId: number,
    chatId: number,
    received: string,
    sent: string,
    type: 'command' | 'callback',
    username?: string,
    firstName?: string
  ): void {
    this.writeLog({
      timestamp: new Date().toISOString(),
      userId,
      username,
      firstName,
      chatId,
      received,
      sent,
      type
    });
  }

  getRecentLogs(count: number = 100): ConversationEntry[] {
    try {
      if (!fs.existsSync(this.logFile)) {
        return [];
      }
      const content = fs.readFileSync(this.logFile, 'utf8');
      const lines = content.trim().split('\n').filter(line => line.length > 0);
      const entries = lines.slice(-count).map(line => JSON.parse(line) as ConversationEntry);
      return entries;
    } catch {
      return [];
    }
  }
}
