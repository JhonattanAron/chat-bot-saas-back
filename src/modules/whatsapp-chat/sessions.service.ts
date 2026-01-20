import { Injectable, Logger } from "@nestjs/common";
import * as fs from "fs";
import * as path from "path";

@Injectable()
export class SessionsService {
  private readonly logger = new Logger(SessionsService.name);
  private basePath = path.resolve(process.cwd(), "whatsapp_sessions");

  constructor() {
    if (!fs.existsSync(this.basePath))
      fs.mkdirSync(this.basePath, { recursive: true });
  }

  saveSession(userId: string, sessionData: any) {
    const dir = path.join(this.basePath, userId);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    const file = path.join(dir, "session.json");
    fs.writeFileSync(file, JSON.stringify(sessionData, null, 2));
    this.logger.log(`Saved session for ${userId} -> ${file}`);
  }

  loadSession(userId: string) {
    const file = path.join(this.basePath, userId, "session.json");
    if (!fs.existsSync(file)) return null;
    try {
      return JSON.parse(fs.readFileSync(file, "utf-8"));
    } catch (e) {
      this.logger.error("Failed to parse session file", e);
      return null;
    }
  }

  removeSession(userId: string) {
    const dir = path.join(this.basePath, userId);
    fs.rmSync(dir, { recursive: true, force: true });
    this.logger.log(`Removed session for ${userId}`);
  }
}
