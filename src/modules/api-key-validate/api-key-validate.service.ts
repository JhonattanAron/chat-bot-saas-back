import { Injectable } from "@nestjs/common";
import crypto from "crypto";
import { ApiKey, ApiKeyDocument } from "./schema/api-key";
import { Model } from "mongoose";
import { InjectModel } from "@nestjs/mongoose";

@Injectable()
export class ApiKeyValidateService {
  constructor(
    @InjectModel(ApiKey.name)
    private readonly apiKeyModel: Model<ApiKeyDocument>
  ) {}

  // Generates a unique API key string
  private generateApiKey(): string {
    return crypto.randomBytes(32).toString("hex"); // Generates a 64-character hex string
  }

  async createApiKey(name: string, user_id: string): Promise<ApiKey> {
    const newKey = this.generateApiKey();
    const createdApiKey = new this.apiKeyModel({
      key: newKey,
      name,
      user_id: user_id,
    });
    return createdApiKey.save();
  }

  async updateApiKey(id: string, name: string): Promise<ApiKey | null> {
    // Mongoose uses _id by default for document IDs
    return this.apiKeyModel
      .findByIdAndUpdate(id, { name }, { new: true })
      .exec();
  }

  async deleteApiKey(id: string): Promise<any> {
    return this.apiKeyModel.findByIdAndDelete(id).exec();
  }

  async findAllApiKeys(): Promise<ApiKey[]> {
    // Exclude the 'key' field for security when listing all keys
    return this.apiKeyModel.find({}, { key: 0 }).exec();
  }

  async validateClientKey(clientKey: string): Promise<boolean> {
    const foundKey = await this.apiKeyModel.findOne({ key: clientKey }).exec();
    return !!foundKey;
  }
}
