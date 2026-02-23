import { Module } from "@nestjs/common";
import { MailController } from "./mail.controller";
import { MailService } from "./mail.service";
import { SessionService } from "./session.service";
import { SessionGuard } from "./guards/session.guard";

@Module({
  controllers: [MailController],
  providers: [MailService, SessionService, SessionGuard],
  exports: [SessionService],
})
export class MailModuleCorporative {}
