import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { Invoice, InvoiceSchema } from "./schemas/invoice.schema";
import { InvoicesService } from "./invoices.service";
import { InvoicesController } from "./invoices.controller";
import { ContractedAssetsModule } from "../contracted-assets/contracted-assets.module";
import { AuthModule } from "../auth/auth.module";

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Invoice.name, schema: InvoiceSchema }]),
    ContractedAssetsModule,
    AuthModule,
  ],
  controllers: [InvoicesController],
  providers: [InvoicesService],
  exports: [InvoicesService],
})
export class InvoicesModule {}
