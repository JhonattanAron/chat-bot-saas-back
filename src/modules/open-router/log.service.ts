import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { GlobalLog, GlobalLogDocument } from "./logs.schema";

interface PaginationOptions {
  limit?: number;
  page?: number;
}

@Injectable()
export class GlobalLogsService {
  constructor(
    @InjectModel(GlobalLog.name) private logModel: Model<GlobalLogDocument>,
  ) {}

  async createLog(data: Partial<GlobalLog>): Promise<GlobalLog> {
    const log = new this.logModel(data);
    return log.save();
  }

  async getRecentLogs(limit = 50): Promise<GlobalLog[]> {
    return this.logModel.find().sort({ createdAt: -1 }).limit(limit).exec();
  }

  async getLogsByUserId(userId: string, options: PaginationOptions = {}) {
    const limit = options.limit || 50;
    const page = options.page && options.page > 0 ? options.page : 1;
    const skip = (page - 1) * limit;

    const logs = await this.logModel
      .find({ userId })
      .sort({ createdAt: -1 }) // los más recientes primero
      .skip(skip)
      .limit(limit)
      .lean();

    const total = await this.logModel.countDocuments({ userId });

    return {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      logs,
    };
  }
}
