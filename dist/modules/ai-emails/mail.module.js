"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MailModule = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mail_log_schema_1 = require("./schemas/mail-log.schema");
const mail_controller_1 = require("./mail.controller");
const mail_service_1 = require("./mail.service");
const chat_module_1 = require("../chat-model/chat/chat.module");
const mail_template_service_1 = require("./services/mail-template.service");
let MailModule = class MailModule {
};
exports.MailModule = MailModule;
exports.MailModule = MailModule = __decorate([
    (0, common_1.Module)({
        imports: [
            mongoose_1.MongooseModule.forFeature([{ name: mail_log_schema_1.MailLog.name, schema: mail_log_schema_1.MailLogSchema }]),
            chat_module_1.ChatModule,
        ],
        controllers: [mail_controller_1.MailController],
        providers: [mail_service_1.MailService, mail_template_service_1.MailTemplateService],
        exports: [mail_service_1.MailService],
    })
], MailModule);
//# sourceMappingURL=mail.module.js.map