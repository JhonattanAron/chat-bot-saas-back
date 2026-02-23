import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
  Res,
  Req,
  BadRequestException,
  Logger,
} from "@nestjs/common";
import { Response, Request } from "express";
import { MailService } from "./mail.service";
import { SessionService } from "./session.service";
import { SessionGuard } from "./guards/session.guard";
import { ConnectDto } from "./dto/connect.dto";
import { SendMailDto } from "./dto/send-mail.dto";
import { CreateDomainDto } from "./dto/create-domain.dto";
import { ListDomainsResponseSuccess } from "resend";

@Controller("mail")
export class MailController {
  private readonly logger = new Logger(MailController.name);

  constructor(
    private mailService: MailService,
    private sessionService: SessionService,
  ) {}

  @Post("connect")
  async connect(
    @Body() dto: ConnectDto,
    @Res({ passthrough: true }) response: Response,
  ): Promise<{ sessionId: string; message: string }> {
    try {
      // Validate API key with Resend
      const isValid = await this.mailService.validateApiKey(dto.apiKey);

      if (!isValid) {
        throw new BadRequestException("Invalid or expired API key");
      }

      // Create session
      const sessionId = this.sessionService.createSession(dto.apiKey);

      // Set httpOnly cookie with session ID
      response.cookie("sessionId", sessionId, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
      });

      this.logger.log("User connected successfully");

      return {
        sessionId,
        message: "Successfully connected to Resend API",
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      this.logger.error(`Connection failed: ${errorMessage}`);
      throw error;
    }
  }

  @Post("disconnect")
  @UseGuards(SessionGuard)
  async disconnect(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ): Promise<{ message: string }> {
    const sessionId = (request as any).sessionId;

    this.sessionService.deleteSession(sessionId);

    // Clear cookie
    response.clearCookie("sessionId", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
    });

    this.logger.log("User disconnected");

    return { message: "Successfully disconnected" };
  }

  @Post("send")
  @UseGuards(SessionGuard)
  async sendEmail(
    @Req() request: Request,
    @Body() dto: SendMailDto,
  ): Promise<any> {
    const apiKey = (request as any).apiKey;

    try {
      const result = await this.mailService.sendEmail(apiKey, dto);
      this.logger.log(`Email sent successfully to ${dto.to}`);
      return result;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      this.logger.error(`Send email failed: ${errorMessage}`);
      throw error;
    }
  }

  @Get("history")
  @UseGuards(SessionGuard)
  async getHistory(): Promise<any[]> {
    return this.mailService.getEmailHistory();
  }

  @Get("domains")
  @UseGuards(SessionGuard)
  async listDomains(
    @Req() request: Request,
  ): Promise<ListDomainsResponseSuccess> {
    const apiKey = (request as any).apiKey;

    try {
      const domains = await this.mailService.listDomains(apiKey);
      this.logger.log("Domains retrieved successfully");
      return domains;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      this.logger.error(`List domains failed: ${errorMessage}`);
      throw error;
    }
  }

  @Post("domains")
  @UseGuards(SessionGuard)
  async createDomain(
    @Req() request: Request,
    @Body() dto: CreateDomainDto,
  ): Promise<any> {
    const apiKey = (request as any).apiKey;

    try {
      const result = await this.mailService.createDomain(apiKey, dto);
      this.logger.log(`Domain created: ${dto.name}`);
      return result;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      this.logger.error(`Create domain failed: ${errorMessage}`);
      throw error;
    }
  }
}
