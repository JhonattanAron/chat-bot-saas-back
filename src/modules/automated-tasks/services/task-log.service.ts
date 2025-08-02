import { Injectable } from "@nestjs/common";
import { Model } from "mongoose";
import { TaskLog, type TaskLogDocument } from "../schemas/task-log.schema";
import { InjectModel } from "@nestjs/mongoose";

@Injectable()
export class TaskLogService {
  constructor(
    @InjectModel(TaskLog.name)
    private readonly taskLogModel: Model<TaskLogDocument>
  ) {}

  async logTaskEvent(
    taskId: string,
    eventType: string,
    message: string,
    data?: any
  ): Promise<TaskLogDocument> {
    const log = new this.taskLogModel({
      taskId,
      eventType,
      message,
      data,
      timestamp: new Date(),
    });

    return log.save();
  }

  async getTaskLogs(taskId: string, limit = 50): Promise<TaskLogDocument[]> {
    return this.taskLogModel
      .find({ taskId })
      .sort({ timestamp: -1 })
      .limit(limit)
      .exec();
  }

  async clearOldLogs(daysToKeep = 30): Promise<any> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    return this.taskLogModel
      .deleteMany({
        timestamp: { $lt: cutoffDate },
      })
      .exec();
  }
}
