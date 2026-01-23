import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types } from "mongoose";
import { randomBytes, createHash } from "crypto";
import {
  WebChatConfig,
  WebChatConfigDocument,
  ClientKeyStatus,
} from "./schemas/web-chat-config.schema";
import { CreateWebChatConfigDto } from "./dto/create-web-chat-config.dto";
import { QueryWebChatConfigDto } from "./dto/query-web-chat-config.dto";
import { UpdateWebChatConfigDto } from "./dto/update-web-chat-config.dto";
import { ValidateClientKeyDto } from "./dto/validate-client-key.dto";
@Injectable()
export class WebChatConfigService {
  constructor(
    @InjectModel(WebChatConfig.name)
    private webChatConfigModel: Model<WebChatConfigDocument>,
  ) {}

  /**
   * Generate a unique client key
   * Format: wck_[32 random hex characters]
   */
  private generateClientKey(): string {
    const randomPart = randomBytes(16).toString("hex");
    return `wck_${randomPart}`;
  }

  /**
   * Generate a hashed version of the client key for secure storage (optional)
   */
  private hashClientKey(clientKey: string): string {
    return createHash("sha256").update(clientKey).digest("hex");
  }

  /**
   * Create a new web chat config with generated client key
   */
  async create(
    createDto: CreateWebChatConfigDto,
  ): Promise<WebChatConfigDocument> {
    const clientKey = this.generateClientKey();

    const webChatConfig = new this.webChatConfigModel({
      clientKey,
      userId: new Types.ObjectId(createDto.userId),
      assistantId: new Types.ObjectId(createDto.assistantId),
      apiKeyId: createDto.apiKeyId
        ? new Types.ObjectId(createDto.apiKeyId)
        : undefined,
      domain: createDto.domain,
      status: ClientKeyStatus.PENDING,
    });

    try {
      return await webChatConfig.save();
    } catch (error: any) {
      if (error.code === 11000) {
        // Duplicate key error, retry with new client key
        return this.create(createDto);
      }
      throw error;
    }
  }

  /**
   * Find all configs with optional filters
   */
  async findAll(
    query: QueryWebChatConfigDto,
  ): Promise<WebChatConfigDocument[]> {
    const filter: Record<string, any> = {};

    if (query.user_id) {
      filter.userId = new Types.ObjectId(query.user_id);
    }

    if (query.assistant_id) {
      filter.assistantId = new Types.ObjectId(query.assistant_id);
    }

    if (query.status) {
      filter.status = query.status;
    }

    if (query.domain) {
      filter.domain = query.domain;
    }

    return this.webChatConfigModel.find(filter).sort({ createdAt: -1 }).exec();
  }

  /**
   * Find one config by ID
   */
  async findOne(id: string, userId?: string): Promise<WebChatConfigDocument> {
    const filter: Record<string, any> = { _id: new Types.ObjectId(id) };

    if (userId) {
      filter.userId = new Types.ObjectId(userId);
    }

    const config = await this.webChatConfigModel.findOne(filter).exec();

    if (!config) {
      throw new NotFoundException(`Web chat config with ID ${id} not found`);
    }

    return config;
  }

  /**
   * Find config by client key
   */
  async findByClientKey(
    clientKey: string,
  ): Promise<WebChatConfigDocument | null> {
    return this.webChatConfigModel.findOne({ clientKey }).exec();
  }

  /**
   * Update a config
   */
  async update(
    id: string,
    updateDto: UpdateWebChatConfigDto,
    userId?: string,
  ): Promise<WebChatConfigDocument> {
    const filter: Record<string, any> = { _id: new Types.ObjectId(id) };

    if (userId) {
      filter.userId = new Types.ObjectId(userId);
    }

    const config = await this.webChatConfigModel
      .findOneAndUpdate(filter, { $set: updateDto }, { new: true })
      .exec();

    if (!config) {
      throw new NotFoundException(`Web chat config with ID ${id} not found`);
    }

    return config;
  }

  /**
   * Approve a config - changes status to approved
   */
  async approve(id: string, userId: string): Promise<WebChatConfigDocument> {
    const config = await this.findOne(id, userId);

    if (config.status === ClientKeyStatus.APPROVED) {
      throw new BadRequestException("Config is already approved");
    }

    if (config.status === ClientKeyStatus.PENDING) {
      throw new BadRequestException(
        "Config must be in waiting_approval status to be approved",
      );
    }

    if (!config.assistantId) {
      throw new BadRequestException(
        "Config must have an assistant ID to be approved",
      );
    }

    config.status = ClientKeyStatus.APPROVED;
    return config.save();
  }

  /**
   * Block a config
   */
  async block(id: string, userId: string): Promise<WebChatConfigDocument> {
    const config = await this.findOne(id, userId);

    if (config.status === ClientKeyStatus.BLOCKED) {
      throw new BadRequestException("Config is already blocked");
    }

    config.status = ClientKeyStatus.BLOCKED;
    return config.save();
  }

  /**
   * Validate client key from frontend and update first use
   * This is called when the SDK makes its first request
   */
  async validateClientKey(validateDto: ValidateClientKeyDto): Promise<{
    valid: boolean;
    config?: WebChatConfigDocument;
    error?: string;
  }> {
    const config = await this.findByClientKey(validateDto.clientKey);

    if (!config) {
      return { valid: false, error: "Invalid client key" };
    }

    if (config.status === ClientKeyStatus.BLOCKED) {
      return { valid: false, error: "Client key is blocked" };
    }

    // Update domain and first used timestamp if this is first use
    const updates: Partial<WebChatConfig> = {
      lastUsedAt: new Date(),
    };

    // If first use, record the domain and change status to waiting_approval
    if (!config.firstUsedAt) {
      updates.firstUsedAt = new Date();
      updates.domain = validateDto.domain;

      if (config.status === ClientKeyStatus.PENDING) {
        updates.status = ClientKeyStatus.WAITING_APPROVAL;
      }
    } else {
      // Check if domain matches (security measure)
      if (config.domain && config.domain !== validateDto.domain) {
        return { valid: false, error: "Domain mismatch" };
      }
    }

    // Increment usage count
    await this.webChatConfigModel.updateOne(
      { _id: config._id },
      {
        $set: updates,
        $inc: { usageCount: 1 },
      },
    );

    // Return if approved
    if (config.status === ClientKeyStatus.APPROVED) {
      return { valid: true, config };
    }

    // If not approved yet, return pending status
    return {
      valid: false,
      error: "Client key is pending approval",
      config,
    };
  }

  /**
   * Regenerate client key for existing config
   */
  async regenerateClientKey(
    id: string,
    userId: string,
  ): Promise<WebChatConfigDocument> {
    const config = await this.findOne(id, userId);

    config.clientKey = this.generateClientKey();
    config.status = ClientKeyStatus.PENDING;
    config.firstUsedAt = undefined;
    config.domain = undefined;
    config.usageCount = 0;

    return config.save();
  }

  /**
   * Delete a config
   */
  async delete(id: string, userId?: string): Promise<void> {
    const filter: Record<string, any> = { _id: new Types.ObjectId(id) };

    if (userId) {
      filter.userId = new Types.ObjectId(userId);
    }

    const result = await this.webChatConfigModel.deleteOne(filter).exec();

    if (result.deletedCount === 0) {
      throw new NotFoundException(`Web chat config with ID ${id} not found`);
    }
  }

  /**
   * Get statistics for a user's configs
   */
  async getStats(userId: string): Promise<{
    total: number;
    pending: number;
    waitingApproval: number;
    approved: number;
    blocked: number;
  }> {
    const userObjectId = new Types.ObjectId(userId);

    const stats = await this.webChatConfigModel.aggregate([
      { $match: { userId: userObjectId } },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
        },
      },
    ]);

    const result = {
      total: 0,
      pending: 0,
      waitingApproval: 0,
      approved: 0,
      blocked: 0,
    };

    stats.forEach((stat) => {
      result.total += stat.count;
      switch (stat._id) {
        case ClientKeyStatus.PENDING:
          result.pending = stat.count;
          break;
        case ClientKeyStatus.WAITING_APPROVAL:
          result.waitingApproval = stat.count;
          break;
        case ClientKeyStatus.APPROVED:
          result.approved = stat.count;
          break;
        case ClientKeyStatus.BLOCKED:
          result.blocked = stat.count;
          break;
      }
    });

    return result;
  }
}
