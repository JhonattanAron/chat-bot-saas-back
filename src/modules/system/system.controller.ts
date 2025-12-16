import { Controller, Post, Headers, ForbiddenException } from "@nestjs/common";
import * as crypto from "crypto";
import { SystemService } from "./system.service";

@Controller("_sys/internal")
export class SystemController {
  constructor(private readonly systemService: SystemService) {}

  @Post("healtverify/v3")
  async verifyDocuments(@Headers("key") key: string) {
    if (!key) {
      throw new ForbiddenException("Missing key");
    }
    const incomingHash = crypto.createHash("sha256").update(key).digest("hex");
    if (incomingHash !== process.env.SYSTEM_KEY) {
      throw new ForbiddenException("Invalid destruction key");
    }
    return this.systemService.VerifyDocumentsHealt();
  }
}
