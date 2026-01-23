import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
} from "@nestjs/common";
import { WebChatConfigService } from "./web-chat-config.service";
import { CreateWebChatConfigDto } from "./dto/create-web-chat-config.dto";
import { QueryWebChatConfigDto } from "./dto/query-web-chat-config.dto";
import {
  UpdateStatusDto,
  UpdateWebChatConfigDto,
} from "./dto/update-web-chat-config.dto";
import { ValidateClientKeyDto } from "./dto/validate-client-key.dto";

@Controller("web-configs")
export class WebChatConfigController {
  constructor(private readonly webChatConfigService: WebChatConfigService) {}

  /**
   * Create a new web chat config and generate client key
   * POST /web-configs
   */
  @Post()
  async create(@Body() createDto: CreateWebChatConfigDto) {
    const config = await this.webChatConfigService.create(createDto);
    return this.transformConfig(config);
  }

  /**
   * Get all configs with optional filters
   * GET /web-configs?user_id=xxx&assistant_id=xxx&status=xxx
   */
  @Get()
  async findAll(@Query() query: QueryWebChatConfigDto) {
    const configs = await this.webChatConfigService.findAll(query);
    return configs.map((config) => this.transformConfig(config));
  }

  /**
   * Get a single config by ID
   * GET /web-configs/:id?user_id=xxx
   */
  @Get(":id")
  async findOne(@Param("id") id: string, @Query("user_id") userId?: string) {
    const config = await this.webChatConfigService.findOne(id, userId);
    return this.transformConfig(config);
  }

  /**
   * Update a config
   * PATCH /web-configs/:id
   */
  @Patch(":id")
  async update(
    @Param("id") id: string,
    @Body() updateDto: UpdateWebChatConfigDto,
    @Query("user_id") userId?: string,
  ) {
    const config = await this.webChatConfigService.update(
      id,
      updateDto,
      userId,
    );
    return this.transformConfig(config);
  }

  /**
   * Approve a config
   * PATCH /web-configs/:id/approve
   */
  @Patch(":id/approve")
  async approve(@Param("id") id: string, @Body() body: UpdateStatusDto) {
    console.log("Aprobadno...");

    const config = await this.webChatConfigService.approve(id, body.userId);
    return this.transformConfig(config);
  }

  /**
   * Block a config
   * PATCH /web-configs/:id/block
   */
  @Patch(":id/block")
  async block(@Param("id") id: string, @Body() body: UpdateStatusDto) {
    const config = await this.webChatConfigService.block(id, body.userId);
    return this.transformConfig(config);
  }

  /**
   * Regenerate client key for a config
   * POST /web-configs/:id/regenerate
   */
  @Post(":id/regenerate")
  async regenerateKey(@Param("id") id: string, @Body() body: UpdateStatusDto) {
    const config = await this.webChatConfigService.regenerateClientKey(
      id,
      body.userId,
    );
    return this.transformConfig(config);
  }

  /**
   * Validate client key from frontend SDK
   * POST /web-configs/validate
   */
  @Post("validate")
  @HttpCode(HttpStatus.OK)
  async validateClientKey(@Body() validateDto: ValidateClientKeyDto) {
    const result =
      await this.webChatConfigService.validateClientKey(validateDto);

    if (result.valid && result.config) {
      return {
        valid: true,
        assistantId: result.config.assistantId?.toString(),
        userId: result.config.userId?.toString(),
        apiKeyId: result.config.apiKeyId?.toString(),
      };
    }

    return {
      valid: false,
      error: result.error,
      status: result.config?.status,
    };
  }

  /**
   * Get stats for a user
   * GET /web-configs/stats/:userId
   */
  @Get("stats/:userId")
  async getStats(@Param("userId") userId: string) {
    return this.webChatConfigService.getStats(userId);
  }

  /**
   * Delete a config
   * DELETE /web-configs/:id
   */
  @Delete(":id")
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(@Param("id") id: string, @Query("user_id") userId?: string) {
    await this.webChatConfigService.delete(id, userId);
  }

  /**
   * Transform MongoDB document to API response format
   */
  private transformConfig(config: any) {
    return {
      id: config._id.toString(),
      clientKey: config.clientKey,
      userId: config.userId?.toString(),
      assistantId: config.assistantId?.toString(),
      apiKeyId: config.apiKeyId?.toString(),
      domain: config.domain,
      status: config.status,
      usageCount: config.usageCount,
      firstUsedAt: config.firstUsedAt?.toISOString(),
      lastUsedAt: config.lastUsedAt?.toISOString(),
      createdAt: config.createdAt?.toISOString(),
      updatedAt: config.updatedAt?.toISOString(),
    };
  }
}
