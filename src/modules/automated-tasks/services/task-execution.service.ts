import { Injectable, Logger } from "@nestjs/common";
import {
  AutomatedTask,
  type AutomatedTaskDocument,
} from "../schemas/automated-task.schema";
import * as cron from "node-cron";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { EmailService } from "./email.service";
import { ChatService } from "src/modules/chat-model/chat/chat.service";
import { NotificationService } from "./notification.service";
import { SystemCommandService } from "./system-command.service";

interface ActionResult {
  actionId: any;
  actionName: string;
  actionType: string;
  success: boolean;
  result?: any;
  error?: string;
}

interface EmailResult {
  clientId: any;
  clientEmail: string;
  success: boolean;
  sentAt?: Date;
  error?: string;
}

@Injectable()
export class TaskExecutionService {
  constructor(
    private readonly emailService: EmailService,
    private readonly systemCommandService: SystemCommandService,
    private readonly notificationService: NotificationService,
    private readonly chatService: ChatService
  ) {}

  async executeTask(task: AutomatedTaskDocument, context?: any): Promise<any> {
    console.log(`Executing task: ${task.name} (${task._id})`);

    // Verificar condiciones
    const conditionsMet = await this.checkConditions(task, context);
    if (!conditionsMet) {
      console.log(`Conditions not met for task: ${task.name}`);
      return { success: false, reason: "Conditions not met" };
    }

    // Ejecutar acciones
    const results: ActionResult[] = [];
    for (const action of task.actions) {
      try {
        const result = await this.executeAction(task, action, context);
        results.push({
          actionId: action._id,
          actionName: action.name,
          actionType: action.type,
          success: true,
          result,
        });
      } catch (error) {
        console.error(`Error executing action ${action.name}:`, error);
        results.push({
          actionId: action._id,
          actionName: action.name,
          actionType: action.type,
          success: false,
          error: error.message,
        });
      }
    }

    return {
      success: true,
      taskId: task._id,
      taskName: task.name,
      executedAt: new Date(),
      results,
    };
  }

  private async checkConditions(
    task: AutomatedTaskDocument,
    context?: any
  ): Promise<boolean> {
    if (!task.conditions || task.conditions.length === 0) {
      return true;
    }

    for (const condition of task.conditions) {
      const conditionMet = await this.evaluateCondition(
        condition,
        context || {},
        task
      );
      if (!conditionMet) {
        return false;
      }
    }

    return true;
  }

  private async evaluateCondition(
    condition: any,
    context: Record<string, any>,
    task: AutomatedTaskDocument
  ): Promise<boolean> {
    const fieldValue = this.getFieldValue(condition.field, context, task);
    const conditionValue = this.replaceVariables(
      condition.value,
      task.variables,
      context
    );

    switch (condition.operator) {
      case "equals":
        return fieldValue === conditionValue;
      case "contains":
        return String(fieldValue)
          .toLowerCase()
          .includes(String(conditionValue).toLowerCase());
      case "greater_than":
        return Number(fieldValue) > Number(conditionValue);
      case "less_than":
        return Number(fieldValue) < Number(conditionValue);
      case "regex":
        const regex = new RegExp(conditionValue);
        return regex.test(String(fieldValue));
      default:
        return false;
    }
  }

  private getFieldValue(
    field: string,
    context: any,
    task: AutomatedTaskDocument
  ): any {
    // Obtener valor del campo desde el contexto, variables de la tarea, o valores del sistema
    if (context && context[field] !== undefined) {
      return context[field];
    }

    if (task.variables && task.variables[field] !== undefined) {
      return task.variables[field];
    }

    // Campos especiales del sistema
    switch (field) {
      case "current_time":
        return new Date().toISOString();
      case "day_of_week":
        return new Date().getDay();
      case "hour":
        return new Date().getHours();
      default:
        return "";
    }
  }

  private async executeAction(
    task: AutomatedTaskDocument,
    action: any,
    context?: any
  ): Promise<any> {
    console.log(`Executing action: ${action.name} (${action.type})`);

    switch (action.type) {
      case "command":
        return this.executeCommandAction(action, task, context);
      case "script":
        return this.executeScriptAction(action, task, context);
      case "api_call":
        return this.executeApiCallAction(action, task, context);
      case "notification":
        return this.executeNotificationAction(action, task, context);
      case "email_reply":
        return this.executeEmailReplyAction(action, task, context);
      case "email_send":
        return this.executeEmailSendAction(action, task, context);
      case "email_forward":
        return this.executeEmailForwardAction(action, task, context);
      case "email_blast":
        return this.executeEmailBlastAction(action, task, context);
      default:
        throw new Error(`Unknown action type: ${action.type}`);
    }
  }

  private async executeCommandAction(
    action: any,
    task: AutomatedTaskDocument,
    context?: any
  ): Promise<any> {
    const command = this.replaceVariables(
      action.config.command,
      task.variables,
      context
    );
    return this.systemCommandService.executeCommand(command);
  }

  private async executeScriptAction(
    action: any,
    task: AutomatedTaskDocument,
    context?: any
  ): Promise<any> {
    const script = this.replaceVariables(
      action.config.script,
      task.variables,
      context
    );
    return this.systemCommandService.executeScript(script);
  }

  private async executeApiCallAction(
    action: any,
    task: AutomatedTaskDocument,
    context?: any
  ): Promise<any> {
    const url = this.replaceVariables(
      action.config.apiUrl,
      task.variables,
      context
    );
    const method = action.config.method || "GET";
    const headers = action.config.headers || {};
    const body = action.config.body
      ? this.replaceVariables(action.config.body, task.variables, context)
      : undefined;

    const response = await fetch(url, {
      method,
      headers: {
        "Content-Type": "application/json",
        ...headers,
      },
      body: body ? JSON.stringify(JSON.parse(body)) : undefined,
    });

    return {
      status: response.status,
      statusText: response.statusText,
      data: await response.json().catch(() => response.text()),
    };
  }

  private async executeNotificationAction(
    action: any,
    task: AutomatedTaskDocument,
    context?: any
  ): Promise<any> {
    const message = this.replaceVariables(
      action.config.notificationMessage,
      task.variables,
      context
    );
    return this.notificationService.sendNotification(message, task.user_id);
  }

  private async executeEmailReplyAction(
    action: any,
    task: AutomatedTaskDocument,
    context?: any
  ): Promise<any> {
    if (!context?.email) {
      throw new Error("No email context provided for reply action");
    }

    const subject = this.replaceVariables(
      action.config.emailSubject,
      task.variables,
      context
    );
    const body = await this.generateAIResponse(
      action.config.emailBody,
      task,
      context
    );

    return this.emailService.sendReply(context.email, subject, body, task);
  }

  private async executeEmailSendAction(
    action: any,
    task: AutomatedTaskDocument,
    context?: any
  ): Promise<any> {
    const to = this.replaceVariables(
      action.config.emailTo,
      task.variables,
      context
    );
    const subject = this.replaceVariables(
      action.config.emailSubject,
      task.variables,
      context
    );
    const body = await this.generateAIResponse(
      action.config.emailBody,
      task,
      context
    );

    return this.emailService.sendEmail(to, subject, body, task);
  }

  private async executeEmailForwardAction(
    action: any,
    task: AutomatedTaskDocument,
    context?: any
  ): Promise<any> {
    if (!context?.email) {
      throw new Error("No email context provided for forward action");
    }

    const forwardTo = this.replaceVariables(
      action.config.forwardTo,
      task.variables,
      context
    );
    return this.emailService.forwardEmail(
      context.email,
      forwardTo,
      action.config.attachOriginal
    );
  }

  private async executeEmailBlastAction(
    action: any,
    task: AutomatedTaskDocument,
    context?: any
  ): Promise<any> {
    const campaign = action.config.campaign;
    if (!campaign) {
      throw new Error("No campaign configuration provided");
    }

    const results: EmailResult[] = [];
    const delayBetweenEmails = action.config.delayBetweenEmails || 30; // seconds

    for (let i = 0; i < campaign.clients.length; i++) {
      const client = campaign.clients[i];

      try {
        // Personalizar el email para cada cliente
        const personalizedSubject = this.replaceVariables(
          campaign.template.subject,
          {
            ...task.variables,
            ...client.customFields,
            name: client.name,
            email: client.email,
            company: client.company,
          },
          context
        );

        const personalizedBody = await this.generateAIResponse(
          campaign.template.body,
          task,
          {
            ...context,
            client,
            name: client.name,
            email: client.email,
            company: client.company,
            ...client.customFields,
          }
        );

        await this.emailService.sendEmail(
          client.email,
          personalizedSubject,
          personalizedBody,
          task
        );

        results.push({
          clientId: client._id,
          clientEmail: client.email,
          success: true,
          sentAt: new Date(),
        });

        // Delay entre emails para evitar spam
        if (i < campaign.clients.length - 1) {
          await new Promise((resolve) =>
            setTimeout(resolve, delayBetweenEmails * 1000)
          );
        }
      } catch (error) {
        results.push({
          clientId: client._id,
          clientEmail: client.email,
          success: false,
          error: error.message,
        });
      }
    }

    return {
      campaignName: campaign.name,
      totalClients: campaign.clients.length,
      successCount: results.filter((r) => r.success).length,
      failureCount: results.filter((r) => !r.success).length,
      results,
    };
  }

  private async generateAIResponse(
    template: string,
    task: AutomatedTaskDocument,
    context?: any
  ): Promise<string> {
    // Si el template contiene variables de IA, generar respuesta usando el chat service
    if (template.includes("{{ai_") || template.includes("{{AI_")) {
      try {
        // Crear un prompt para el bot basado en el contexto de la tarea
        const aiPrompt = `${task.prompt}\n\nContexto actual: ${JSON.stringify(context)}\n\nGenera una respuesta apropiada para: ${template}`;

        // Usar el chat service para generar la respuesta
        const chat = await this.chatService.createChat(
          task.user_id,
          task.assistant_id,
          aiPrompt
        );
        const aiResponse =
          chat.messages[chat.messages.length - 1]?.content || "";

        // Reemplazar las variables de IA en el template
        let processedTemplate = template.replace(
          /\{\{ai_[^}]+\}\}/gi,
          aiResponse
        );
        processedTemplate = this.replaceVariables(
          processedTemplate,
          task.variables,
          context
        );

        return processedTemplate;
      } catch (error) {
        console.error("Error generating AI response:", error);
        // Fallback: usar el template sin procesamiento de IA
        return this.replaceVariables(template, task.variables, context);
      }
    }

    return this.replaceVariables(template, task.variables, context);
  }

  private replaceVariables(
    text: string,
    variables: Record<string, string> = {},
    context?: any
  ): string {
    if (!text) return "";

    let result = text;

    // Reemplazar variables de la tarea
    Object.entries(variables).forEach(([key, value]) => {
      const regex = new RegExp(`\\{\\{${key}\\}\\}`, "g");
      result = result.replace(regex, value);
    });

    // Reemplazar variables del contexto
    if (context) {
      Object.entries(context).forEach(([key, value]) => {
        const regex = new RegExp(`\\{\\{${key}\\}\\}`, "g");
        result = result.replace(regex, String(value));
      });
    }

    // Variables del sistema
    result = result.replace(/\{\{timestamp\}\}/g, new Date().toISOString());
    result = result.replace(/\{\{date\}\}/g, new Date().toLocaleDateString());
    result = result.replace(/\{\{time\}\}/g, new Date().toLocaleTimeString());

    return result;
  }

  // Agregar los métodos faltantes
  async shouldExecuteScheduledTask(
    task: AutomatedTaskDocument
  ): Promise<boolean> {
    const schedule = task.trigger.config.schedule;
    if (!schedule) return false;

    try {
      // Verificar si es tiempo de ejecutar según el cron schedule
      return cron.validate(schedule) && this.isTimeToExecute(schedule);
    } catch (error) {
      console.error(`Invalid cron schedule for task ${task.name}: ${schedule}`);
      return false;
    }
  }

  private isTimeToExecute(cronExpression: string): boolean {
    // Implementación simplificada - en producción usar una librería más robusta
    const now = new Date();
    const currentMinute = now.getMinutes();
    const currentHour = now.getHours();
    const currentDay = now.getDate();
    const currentMonth = now.getMonth() + 1;
    const currentDayOfWeek = now.getDay();

    // Esta es una implementación básica - para producción usar node-cron o similar
    return true; // Simplificado para el ejemplo
  }

  async checkApiMonitorCondition(
    task: AutomatedTaskDocument
  ): Promise<boolean> {
    const apiUrl = task.trigger.config.apiUrl;
    const condition = task.trigger.config.condition;

    if (!apiUrl) return false;

    try {
      const startTime = Date.now();
      const response = await fetch(apiUrl);
      const responseTime = Date.now() - startTime;

      const context = {
        response_time: responseTime,
        status_code: response.status,
        response_ok: response.ok,
      };

      // Evaluar la condición
      if (condition) {
        return this.evaluateApiCondition(condition, context);
      }

      return false;
    } catch (error) {
      console.error(`Error checking API monitor for task ${task.name}:`, error);
      return true; // Ejecutar la tarea si hay error en la API
    }
  }

  private evaluateApiCondition(condition: string, context: any): boolean {
    try {
      // Reemplazar variables en la condición
      let evaluableCondition = condition;
      Object.entries(context).forEach(([key, value]) => {
        evaluableCondition = evaluableCondition.replace(
          new RegExp(key, "g"),
          String(value)
        );
      });

      // Evaluar la condición (implementación básica)
      // En producción, usar una librería más segura para evaluar expresiones
      return eval(evaluableCondition);
    } catch (error) {
      console.error("Error evaluating API condition:", error);
      return false;
    }
  }
}
