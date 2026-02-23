import { Injectable, Logger } from "@nestjs/common";
import { v4 as uuidv4 } from "uuid";

interface SessionData {
  apiKey: string;
  expiresAt: number;
}

@Injectable()
export class SessionService {
  private readonly logger = new Logger(SessionService.name);
  private sessions: Map<string, SessionData> = new Map();
  private cleanupInterval: NodeJS.Timeout;
  private readonly SESSION_DURATION = 24 * 60 * 60 * 1000; // 24 hours
  private readonly CLEANUP_INTERVAL = 10 * 60 * 1000; // 10 minutes

  constructor() {
    this.startCleanupInterval();
  }

  private startCleanupInterval(): void {
    this.cleanupInterval = setInterval(() => {
      const now = Date.now();
      let cleanedCount = 0;

      for (const [sessionId, sessionData] of this.sessions.entries()) {
        if (now > sessionData.expiresAt) {
          this.sessions.delete(sessionId);
          cleanedCount++;
        }
      }

      if (cleanedCount > 0) {
        this.logger.debug(`Cleaned up ${cleanedCount} expired sessions`);
      }
    }, this.CLEANUP_INTERVAL);
  }

  createSession(apiKey: string): string {
    const sessionId = uuidv4();
    const expiresAt = Date.now() + this.SESSION_DURATION;

    this.sessions.set(sessionId, {
      apiKey,
      expiresAt,
    });

    this.logger.debug(`Session created: ${sessionId}`);
    return sessionId;
  }

  getSession(sessionId: string): SessionData | null {
    const session = this.sessions.get(sessionId);

    if (!session) {
      return null;
    }

    if (Date.now() > session.expiresAt) {
      this.sessions.delete(sessionId);
      return null;
    }

    return session;
  }

  deleteSession(sessionId: string): boolean {
    const deleted = this.sessions.delete(sessionId);
    if (deleted) {
      this.logger.debug(`Session deleted: ${sessionId}`);
    }
    return deleted;
  }

  isSessionValid(sessionId: string): boolean {
    return this.getSession(sessionId) !== null;
  }

  onModuleDestroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
  }
}
