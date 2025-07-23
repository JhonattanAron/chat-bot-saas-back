import {
  Controller,
  Post,
  Put,
  Delete,
  Get,
  Param,
  Body,
  HttpCode,
  HttpStatus,
  NotFoundException,
  BadRequestException,
  InternalServerErrorException,
} from "@nestjs/common";
import { ApiKeyValidateService } from "./api-key-validate.service";

@Controller("api-key-validate")
export class ApiKeyValidateController {
  constructor(private readonly apiKeyValidateService: ApiKeyValidateService) {}

  @Post("api-keys")
  async createApiKey(@Body() body: { name: string }) {
    if (!body.name) {
      throw new BadRequestException("Name is required");
    }

    const apiKey = await this.apiKeyValidateService.createApiKey(body.name);
    return {
      message: "API Key created successfully",
      apiKey: {
        id: apiKey._id,
        name: apiKey.name,
        key: apiKey.key,
      },
    };
  }

  @Put("api-keys/:id")
  async updateApiKey(@Param("id") id: string, @Body() body: { name: string }) {
    if (!body.name) {
      throw new BadRequestException("Name is required");
    }

    const updatedApiKey = await this.apiKeyValidateService.updateApiKey(
      id,
      body.name
    );

    if (!updatedApiKey) {
      throw new NotFoundException("API Key not found");
    }

    return {
      message: "API Key updated successfully",
      apiKey: {
        id: updatedApiKey._id,
        name: updatedApiKey.name,
      },
    };
  }

  @Delete("api-keys/:id")
  @HttpCode(HttpStatus.OK)
  async deleteApiKey(@Param("id") id: string) {
    const result = await this.apiKeyValidateService.deleteApiKey(id);
    if (!result || result.deletedCount === 0) {
      throw new NotFoundException("API Key not found");
    }

    return {
      message: "API Key deleted successfully",
    };
  }

  @Get("api-keys")
  async getAllApiKeys() {
    const apiKeys = await this.apiKeyValidateService.findAllApiKeys();
    return { apiKeys };
  }

  @Post("validate-client-key")
  async validateClientKey(@Body() body: { clientKey: string }) {
    if (!body.clientKey) {
      throw new BadRequestException("clientKey is required.");
    }

    const isValid = await this.apiKeyValidateService.validateClientKey(
      body.clientKey
    );

    if (!isValid) {
      return {
        success: false,
        message: "Invalid client key or unauthorized.",
      };
    }

    return {
      success: true,
      message: "Client key validated successfully.",
    };
  }
}
