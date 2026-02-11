import { Body, Controller, Get, Param, Post } from "@nestjs/common";
import { ScrapersService } from "./scrapers.service";
import { ImportOptionsDto } from "./import-options.dto";

@Controller("scrapers")
export class ScrapersController {
  constructor(private readonly service: ScrapersService) {}

  @Get()
  getScrapers() {
    return this.service.getScrapers();
  }

  @Get(":source/batches")
  getBatches(@Param("source") source: string) {
    return this.service.getBatches(source);
  }

  @Post(":source/batches/:batchId/import")
  importBatch(
    @Param("source") source: string,
    @Param("batchId") batchId: string,
    @Body() dto: ImportOptionsDto,
  ) {
    return this.service.importBatch(source, batchId, dto);
  }
}
