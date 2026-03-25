import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { Usage, UsageDocument } from "./usage.schema";

@Injectable()
export class UsageService {
  constructor(
    @InjectModel(Usage.name)
    private readonly usageModel: Model<UsageDocument>,
  ) {}

  // 🔥 registrar consumo
  async consumeResource(userId: string, resourceId: string, amount: number) {
    return this.usageModel.create({
      userId,
      resourceId,
      used: amount,
    });
  }

  // 🔥 total consumido
  async getTotalUsed(userId: string, resourceId: string) {
    const result = await this.usageModel.aggregate([
      { $match: { userId, resourceId } },
      {
        $group: {
          _id: null,
          total: { $sum: "$used" },
        },
      },
    ]);

    return result[0]?.total || 0;
  }
}
