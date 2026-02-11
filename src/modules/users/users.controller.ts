import {
  Controller,
  Post,
  Body,
  Get,
  Query,
  Put,
  Delete,
  Param,
} from "@nestjs/common";
import { UsersService } from "./users.service";

@Controller("users")
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post("test")
  async testEndpoint(body: any) {
    return {
      success: true,
      message: "Users controller is working",
      received_body: body,
      timestamp: new Date().toISOString(),
    };
  }
}
