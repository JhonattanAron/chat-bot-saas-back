import { Injectable, Logger } from "@nestjs/common";
import { exec } from "child_process";
import { promisify } from "util";
import * as fs from "fs";
import * as path from "path";

const execAsync = promisify(exec);

interface SystemCheck {
  name: string;
  success: boolean;
  data?: string;
  error?: string;
}

@Injectable()
export class SystemCommandService {
  async executeCommand(command: string): Promise<any> {
    try {
      console.log(`Executing command: ${command}`);

      const { stdout, stderr } = await execAsync(command, {
        timeout: 30000, // 30 seconds timeout
        maxBuffer: 1024 * 1024, // 1MB buffer
      });

      return {
        success: true,
        command,
        stdout: stdout.trim(),
        stderr: stderr.trim(),
        executedAt: new Date(),
      };
    } catch (error) {
      console.error(`Command execution failed: ${command}`, error);

      return {
        success: false,
        command,
        error: error.message,
        stdout: error.stdout || "",
        stderr: error.stderr || "",
        executedAt: new Date(),
      };
    }
  }

  async executeScript(script: string, language = "bash"): Promise<any> {
    try {
      console.log(`Executing ${language} script`);

      // Crear archivo temporal para el script
      const tempDir = path.join(process.cwd(), "temp");
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
      }

      const scriptExtension = this.getScriptExtension(language);
      const scriptPath = path.join(
        tempDir,
        `script_${Date.now()}.${scriptExtension}`
      );

      // Escribir script al archivo temporal
      fs.writeFileSync(scriptPath, script);

      // Ejecutar script
      const command = this.getExecutionCommand(language, scriptPath);
      const result = await this.executeCommand(command);

      // Limpiar archivo temporal
      try {
        fs.unlinkSync(scriptPath);
      } catch (cleanupError) {
        console.warn(`Failed to cleanup script file: ${scriptPath}`);
      }

      return {
        ...result,
        language,
        scriptPath: scriptPath.replace(process.cwd(), ""),
      };
    } catch (error) {
      console.error(`Script execution failed:`, error);
      throw error;
    }
  }

  async checkSystemHealth(): Promise<any> {
    const checks: SystemCheck[] = [];

    // Check disk space
    try {
      const diskResult = await this.executeCommand("df -h /");
      checks.push({
        name: "Disk Space",
        success: diskResult.success,
        data: diskResult.stdout,
      });
    } catch (error) {
      checks.push({
        name: "Disk Space",
        success: false,
        error: error.message,
      });
    }

    // Check memory usage
    try {
      const memResult = await this.executeCommand("free -h");
      checks.push({
        name: "Memory Usage",
        success: memResult.success,
        data: memResult.stdout,
      });
    } catch (error) {
      checks.push({
        name: "Memory Usage",
        success: false,
        error: error.message,
      });
    }

    // Check CPU usage
    try {
      const cpuResult = await this.executeCommand("top -bn1 | grep 'Cpu(s)'");
      checks.push({
        name: "CPU Usage",
        success: cpuResult.success,
        data: cpuResult.stdout,
      });
    } catch (error) {
      checks.push({
        name: "CPU Usage",
        success: false,
        error: error.message,
      });
    }

    // Check running processes
    try {
      const processResult = await this.executeCommand(
        "ps aux --sort=-%cpu | head -10"
      );
      checks.push({
        name: "Top Processes",
        success: processResult.success,
        data: processResult.stdout,
      });
    } catch (error) {
      checks.push({
        name: "Top Processes",
        success: false,
        error: error.message,
      });
    }

    return {
      timestamp: new Date(),
      overallHealth: checks.every((check) => check.success),
      checks,
    };
  }

  private getScriptExtension(language: string): string {
    switch (language.toLowerCase()) {
      case "bash":
      case "sh":
        return "sh";
      case "python":
      case "py":
        return "py";
      case "javascript":
      case "js":
        return "js";
      case "powershell":
      case "ps1":
        return "ps1";
      default:
        return "sh";
    }
  }

  private getExecutionCommand(language: string, scriptPath: string): string {
    switch (language.toLowerCase()) {
      case "bash":
      case "sh":
        return `bash ${scriptPath}`;
      case "python":
      case "py":
        return `python3 ${scriptPath}`;
      case "javascript":
      case "js":
        return `node ${scriptPath}`;
      case "powershell":
      case "ps1":
        return `powershell -ExecutionPolicy Bypass -File ${scriptPath}`;
      default:
        return `bash ${scriptPath}`;
    }
  }
}
