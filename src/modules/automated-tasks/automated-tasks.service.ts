import { Injectable, Logger, NotFoundException } from "@nestjs/common";

import { Cron, CronExpression } from "@nestjs/schedule";
import {
  AutomatedTask,
  type AutomatedTaskDocument,
} from "./schemas/automated-task.schema";
import {
  CreateAutomatedTaskDto,
  UpdateAutomatedTaskDto,
} from "./dto/automated-task.dto";
import { TaskExecutionService } from "./services/task-execution.service";
import { EmailService } from "./services/email.service";
import { SystemCommandService } from "./services/system-command.service";
import { TaskLogService } from "./services/task-log.service";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";

@Injectable()
export class AutomatedTasksService {
  constructor(
    @InjectModel(AutomatedTask.name)
    private readonly automatedTaskModel: Model<AutomatedTaskDocument>,
    private readonly taskExecutionService: TaskExecutionService,
    private readonly emailService: EmailService,
    private readonly systemCommandService: SystemCommandService,
    private readonly taskLogService: TaskLogService
  ) {}

  async createTask(
    createTaskDto: CreateAutomatedTaskDto
  ): Promise<AutomatedTaskDocument> {
    const task = new this.automatedTaskModel(createTaskDto);
    const savedTask = await task.save();

    await this.taskLogService.logTaskEvent(
      (savedTask._id as any).toString(),
      "CREATED",
      `Task "${savedTask.name}" created successfully`
    );

    return savedTask;
  }

  async getTasks(filters: {
    user_id: string;
    assistant_id?: string;
    category?: string;
    status?: string;
  }): Promise<AutomatedTaskDocument[]> {
    const query: any = { user_id: filters.user_id };

    if (filters.assistant_id) {
      query.assistant_id = filters.assistant_id;
    }

    if (filters.category) {
      query.category = filters.category;
    }

    if (filters.status) {
      query.status = filters.status;
    }

    return this.automatedTaskModel.find(query).sort({ createdAt: -1 }).exec();
  }

  async getTaskById(
    id: string,
    user_id: string
  ): Promise<AutomatedTaskDocument | null> {
    return this.automatedTaskModel.findOne({ _id: id, user_id }).exec();
  }

  async updateTask(
    id: string,
    user_id: string,
    updateTaskDto: UpdateAutomatedTaskDto
  ): Promise<AutomatedTaskDocument | null> {
    const task = await this.automatedTaskModel
      .findOneAndUpdate(
        { _id: id, user_id },
        { ...updateTaskDto, updatedAt: new Date() },
        { new: true }
      )
      .exec();

    if (task) {
      await this.taskLogService.logTaskEvent(
        id,
        "UPDATED",
        `Task "${task.name}" updated successfully`
      );
    }

    return task;
  }

  async deleteTask(id: string, user_id: string): Promise<boolean> {
    const result = await this.automatedTaskModel
      .findOneAndDelete({ _id: id, user_id })
      .exec();

    if (result) {
      await this.taskLogService.logTaskEvent(
        id,
        "DELETED",
        `Task "${result.name}" deleted successfully`
      );
      return true;
    }

    return false;
  }

  async toggleTaskStatus(
    id: string,
    user_id: string
  ): Promise<AutomatedTaskDocument | null> {
    const task = await this.automatedTaskModel
      .findOne({ _id: id, user_id })
      .exec();

    if (!task) {
      return null;
    }

    const newStatus = task.status === "active" ? "inactive" : "active";
    const updatedTask = await this.automatedTaskModel
      .findOneAndUpdate(
        { _id: id, user_id },
        { status: newStatus, updatedAt: new Date() },
        { new: true }
      )
      .exec();

    if (updatedTask) {
      await this.taskLogService.logTaskEvent(
        id,
        "STATUS_CHANGED",
        `Task status changed to ${newStatus}`
      );
    }

    return updatedTask;
  }

  async executeTask(id: string, user_id: string, context?: any): Promise<any> {
    const task = await this.getTaskById(id, user_id);

    if (!task) {
      throw new NotFoundException("Task not found");
    }

    if (task.status !== "active") {
      throw new Error("Task is not active");
    }

    try {
      await this.taskLogService.logTaskEvent(
        id,
        "EXECUTION_STARTED",
        `Task execution started`
      );

      const result = await this.taskExecutionService.executeTask(task, context);

      // Update task statistics
      await this.automatedTaskModel.findByIdAndUpdate(id, {
        lastRun: new Date(),
        $inc: { runCount: 1 },
        $unset: { lastError: 1 },
      });

      await this.taskLogService.logTaskEvent(
        id,
        "EXECUTION_COMPLETED",
        `Task execution completed successfully`,
        result
      );

      return result;
    } catch (error) {
      await this.automatedTaskModel.findByIdAndUpdate(id, {
        lastError: error.message,
        status: "error",
      });

      await this.taskLogService.logTaskEvent(
        id,
        "EXECUTION_FAILED",
        `Task execution failed: ${error.message}`,
        {
          error: error.message,
        }
      );

      throw error;
    }
  }

  async getTaskLogs(id: string, user_id: string, limit = 50): Promise<any[]> {
    // Verify task belongs to user
    const task = await this.getTaskById(id, user_id);
    if (!task) {
      throw new NotFoundException("Task not found");
    }

    return this.taskLogService.getTaskLogs(id, limit);
  }

  async testEmailConnection(emailConfig: any): Promise<any> {
    return this.emailService.testConnection(emailConfig);
  }

  async handleWebhookTrigger(taskId: string, payload: any): Promise<any> {
    const task = await this.automatedTaskModel.findById(taskId).exec();

    if (!task) {
      throw new NotFoundException("Task not found");
    }

    if (task.status !== "active" || task.trigger.type !== "webhook") {
      throw new Error("Task is not active or not configured for webhooks");
    }

    return this.executeTask(taskId, task.user_id, { webhook_payload: payload });
  }

  // Cron job para ejecutar tareas programadas
  @Cron(CronExpression.EVERY_MINUTE)
  async handleScheduledTasks() {
    try {
      const scheduledTasks = await this.automatedTaskModel
        .find({
          status: "active",
          "trigger.type": { $in: ["schedule", "scheduled_email_blast"] },
        })
        .exec();

      for (const task of scheduledTasks) {
        try {
          const shouldExecute =
            await this.taskExecutionService.shouldExecuteScheduledTask(task);

          if (shouldExecute) {
            console.log(`Executing scheduled task: ${task.name}`);
            await this.executeTask((task._id as any).toString(), task.user_id);
          }
        } catch (error) {
          console.error(`Error executing scheduled task ${task.name}:`, error);
        }
      }
    } catch (error) {
      console.error("Error in scheduled tasks cron job:", error);
    }
  }

  // Cron job para monitorear APIs
  @Cron(CronExpression.EVERY_5_MINUTES)
  async handleApiMonitorTasks() {
    try {
      const apiMonitorTasks = await this.automatedTaskModel
        .find({
          status: "active",
          "trigger.type": "api_monitor",
        })
        .exec();

      for (const task of apiMonitorTasks) {
        try {
          const shouldExecute =
            await this.taskExecutionService.checkApiMonitorCondition(task);

          if (shouldExecute) {
            console.log(`API monitor triggered for task: ${task.name}`);
            await this.executeTask((task._id as any).toString(), task.user_id);
          }
        } catch (error) {
          console.error(`Error in API monitor for task ${task.name}:`, error);
        }
      }
    } catch (error) {
      console.error("Error in API monitor cron job:", error);
    }
  }

  // Cron job para monitorear emails
  @Cron(CronExpression.EVERY_5_MINUTES)
  async handleEmailMonitorTasks() {
    try {
      const emailTasks = await this.automatedTaskModel
        .find({
          status: "active",
          "trigger.type": "email_received",
        })
        .exec();

      for (const task of emailTasks) {
        try {
          const newEmails = await this.emailService.checkForNewEmails(task);

          if (newEmails.length > 0) {
            console.log(
              `New emails found for task: ${task.name} (${newEmails.length} emails)`
            );

            for (const email of newEmails) {
              await this.executeTask(
                (task._id as any).toString(),
                task.user_id,
                { email }
              );
            }
          }
        } catch (error) {
          console.error(`Error checking emails for task ${task.name}:`, error);
        }
      }
    } catch (error) {
      console.error("Error in email monitor cron job:", error);
    }
  }
}
