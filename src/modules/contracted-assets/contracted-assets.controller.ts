import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from "@nestjs/common";
import { ProxyAuthGuard } from "../auth/proxy-auth.guard";
import { ContractedAssetsService } from "./contracted-assets.service";

@Controller("contracted-assets")
@UseGuards(ProxyAuthGuard)
export class ContractedAssetsController {
  constructor(private readonly service: ContractedAssetsService) {}
}
