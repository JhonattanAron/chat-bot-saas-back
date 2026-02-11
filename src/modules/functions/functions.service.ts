import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import {
  AssistantChat,
  AssistantChatDocument,
} from "../assistant-chats/assistant-chat.schema";

@Injectable()
export class FunctionsService {
  @InjectModel(AssistantChat.name)
  private assistantModel: Model<AssistantChatDocument>;

  async addFunctionToAssistant(
    assistantId: string,
    userId: string,
    newFunction: any,
  ) {
    const assistant = await this.assistantModel.findOneAndUpdate(
      { _id: assistantId, user_id: userId },
      { $push: { funciones: newFunction } },
      { new: true },
    );

    if (!assistant) {
      throw new NotFoundException("Assistant not found");
    }

    return assistant;
  }

  async updateFunction(
    assistantId: string,
    userId: string,
    functionId: string,
    updateData: any,
  ) {
    const updateFields: any = {};

    if (updateData.name !== undefined)
      updateFields["funciones.$.name"] = updateData.name;
    if (updateData.description !== undefined)
      updateFields["funciones.$.description"] = updateData.description;
    if (updateData.type !== undefined)
      updateFields["funciones.$.type"] = updateData.type;
    if (updateData.code !== undefined)
      updateFields["funciones.$.code"] = updateData.code;
    if (updateData.credentials !== undefined)
      updateFields["funciones.$.credentials"] = updateData.credentials;

    if (updateData.api) {
      if (updateData.api.url !== undefined)
        updateFields["funciones.$.api.url"] = updateData.api.url;
      if (updateData.api.method !== undefined)
        updateFields["funciones.$.api.method"] = updateData.api.method;
      if (updateData.api.headers !== undefined)
        updateFields["funciones.$.api.headers"] = updateData.api.headers;
      if (updateData.api.parameters !== undefined)
        updateFields["funciones.$.api.parameters"] = updateData.api.parameters;
      if (updateData.api.auth !== undefined)
        updateFields["funciones.$.api.auth"] = updateData.api.auth;
    }

    const assistant = await this.assistantModel.findOneAndUpdate(
      {
        _id: assistantId,
        user_id: userId,
        "funciones._id": functionId,
      },
      { $set: updateFields },
      { new: true },
    );

    if (!assistant) {
      throw new NotFoundException("Function or Assistant not found");
    }

    return assistant;
  }

  async deleteFunction(
    assistantId: string,
    userId: string,
    functionId: string,
  ) {
    const assistant = await this.assistantModel.findOneAndUpdate(
      { _id: assistantId, user_id: userId },
      { $pull: { funciones: { _id: functionId } } },
      { new: true },
    );

    if (!assistant) {
      throw new NotFoundException("Assistant not found");
    }

    return assistant;
  }

  async getFunctionsByAssistant(assistantId: string, userId: string) {
    const assistant = await this.assistantModel.findOne({
      _id: assistantId,
      user_id: userId,
    });

    if (!assistant) {
      throw new NotFoundException("Assistant not found");
    }

    return assistant.funciones || [];
  }
}
