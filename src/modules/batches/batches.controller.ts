import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  HttpException,
  HttpStatus,
  Patch,
} from "@nestjs/common";
import { BatchesService } from "./batches.service";

@Controller("batches")
export class BatchesController {
  constructor(private readonly batchesService: BatchesService) {}

  @Post()
  async createBatch(@Body() body: { user_id: string; search_query: string }) {
    return this.batchesService.createBatch(body.user_id, body.search_query);
  }

  @Get()
  async findAll() {
    return this.batchesService.findAll();
  }

  @Get(":id")
  async findById(@Param("id") id: string) {
    return this.batchesService.findById(id);
  }

  // 👇 AQUI ESTA EL ENDPOINT QUE TE FALTABA
  @Get(":id/leads")
  async getLeads(@Param("id") id: string) {
    return this.batchesService.getLeadsByBatchId(id);
  }
  @Post(":id/extract")
  async extract(@Param("id") batchId: string) {
    return this.batchesService.extractBatch(batchId);
  }
  @Get(":id/export")
  async exportBatch(@Param("id") id: string) {
    const exportData = await this.batchesService.getLatestExport(id);

    if (!exportData) {
      throw new HttpException(
        "No export found. Please generate plain text first.",
        HttpStatus.NOT_FOUND
      );
    }

    // Formatear contenido para que sea más legible
    const formattedContent = exportData.content
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.length > 0)
      .join("  "); // Separar cada línea por doble espacio

    const filename = `leadscraper-${exportData.batch_id}-${new Date().toISOString().split("T")[0]}.txt`;

    return {
      filename,
      content: formattedContent,
      contentType: "text/plain",
    };
  }

  @Get("get/text")
  async getPlainText() {
    const data = await this.batchesService.findAllPlaintextExports();
    return data;
  }

  @Post(":id/generate")
  async generate(@Param("id") batchId: string) {
    return this.batchesService.generateBatch(batchId);
  }
  @Patch(":id/analized")
  async updateAnalized(
    @Param("id") id: string,
    @Body("analized") analized: boolean,
    @Body("analized_data") analized_data: string
  ) {
    return this.batchesService.updateAnalizedData(id, analized, analized_data);
  }
  @Get(":id/json-analized")
  async getAnalizedText(@Param("id") id: string) {
    return this.batchesService.JsonAnalized(id);
  }
}
