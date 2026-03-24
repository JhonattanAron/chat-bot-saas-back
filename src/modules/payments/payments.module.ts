import { Module } from "@nestjs/common";
import { HttpModule } from "@nestjs/axios";
import { ConfigModule } from "@nestjs/config";
import { PaymentsService } from "./payments.service";
import { PaymentsController } from "./payments.controller";
import { InvoicesModule } from "../invoices/invoices.module";

@Module({
  imports: [HttpModule, ConfigModule, InvoicesModule],
  controllers: [PaymentsController],
  providers: [PaymentsService],
  exports: [PaymentsService],
})
export class PaymentsModule {}
