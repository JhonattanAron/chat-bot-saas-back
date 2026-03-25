import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
  Query,
} from "@nestjs/common";
import { InvoicesService } from "./invoices.service";
import {
  CreateInvoiceDto,
  UpdateInvoiceDto,
  CheckoutInvoiceDto,
} from "./dto/invoice.dto";
import { InvoiceStatus } from "./schemas/invoice.schema";
import { ProxyAuthGuard } from "../auth/proxy-auth.guard";

@Controller("invoices")
@UseGuards(ProxyAuthGuard)
export class InvoicesController {
  constructor(private invoicesService: InvoicesService) {}

  @Post()
  async create(@Request() req, @Body() createInvoiceDto: CreateInvoiceDto) {
    const dto = { ...createInvoiceDto, status: InvoiceStatus.Pending };
    return this.invoicesService.create(req.user.id, dto);
  }

  @Post("checkout")
  async createFromCheckout(@Request() req, @Body() body: any) {
    // guardamos los items completos
    const checkoutDto = { ...body, cartItems: body.items };
    return this.invoicesService.createFromCheckout(req.user.id, checkoutDto);
  }
  @Get()
  async findAll(
    @Request() req,
    @Query("limit") limit = 50,
    @Query("skip") skip = 0,
  ) {
    return this.invoicesService.findByUser(req.user.id, limit, skip);
  }

  @Get("stats")
  async getStats(@Request() req) {
    return this.invoicesService.getUserStats(req.user.id);
  }

  @Get(":id")
  async findOne(@Request() req, @Param("id") id: string) {
    return this.invoicesService.findById(id, req.user.id);
  }

  @Put(":id")
  async update(
    @Request() req,
    @Param("id") id: string,
    @Body() updateInvoiceDto: UpdateInvoiceDto,
  ) {
    const dto = { ...updateInvoiceDto, status: InvoiceStatus.Pending };
    return this.invoicesService.update(id, req.user.id, dto);
  }
  @Put(":number/number")
  async updatePerNumber(
    @Request() req,
    @Param("number") invoiceNumber: string,
    @Body() updateInvoiceDto: UpdateInvoiceDto,
  ) {
    return this.invoicesService.updateByInvoiceNumber(
      invoiceNumber,
      req.user.id,
      updateInvoiceDto,
    );
  }

  @Put(":id/status")
  async updateStatus(
    @Request() req,
    @Param("id") id: string,
    @Body() body: { status: InvoiceStatus },
  ) {
    return this.invoicesService.updateStatus(id, req.user.id, body.status);
  }

  @Delete(":id")
  async delete(@Request() req, @Param("id") id: string) {
    const deleted = await this.invoicesService.delete(id, req.user.id);
    return { success: deleted };
  }

  @Get("number/:invoiceNumber")
  async getByInvoiceNumber(@Param("invoiceNumber") invoiceNumber: string) {
    return this.invoicesService.getByInvoiceNumber(invoiceNumber);
  }
}
