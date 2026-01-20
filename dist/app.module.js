"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const app_controller_1 = require("./app.controller");
const app_service_1 = require("./app.service");
const session_controller_1 = require("./modules/session/session.controller");
const mongoose_1 = require("@nestjs/mongoose");
const products_module_1 = require("./modules/products/products.module");
const chat_module_1 = require("./modules/chat-model/chat/chat.module");
const schedule_1 = require("@nestjs/schedule");
const users_module_1 = require("./modules/users/users.module");
const config_1 = require("@nestjs/config");
const auth_module_1 = require("./modules/auth/auth.module");
const faqs_module_1 = require("./modules/faqs/faqs.module");
const api_key_validate_module_1 = require("./modules/api-key-validate/api-key-validate.module");
const dashboard_module_1 = require("./modules/dashboard/dashboard.module");
const telegram_chat_module_1 = require("./modules/telegram-chat/telegram-chat.module");
const plans_module_1 = require("./modules/plans/plans.module");
const batches_module_1 = require("./modules/batches/batches.module");
const system_module_1 = require("./modules/system/system.module");
const mail_module_1 = require("./modules/ai-emails/mail.module");
const campaign_automated_module_1 = require("./modules/automated-tasks/campaign-automated/campaign-automated.module");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({
                isGlobal: true,
                envFilePath: ".env",
            }),
            mongoose_1.MongooseModule.forRoot(process.env.DATABASE_URL || ""),
            products_module_1.ProductsModule,
            chat_module_1.ChatModule,
            schedule_1.ScheduleModule.forRoot(),
            users_module_1.UsersModule,
            auth_module_1.AuthModule,
            faqs_module_1.FaqsModule,
            api_key_validate_module_1.ApiKeyValidateModule,
            dashboard_module_1.DashboardModule,
            telegram_chat_module_1.TelegramChatModule,
            plans_module_1.PlansModule,
            mail_module_1.MailModule,
            batches_module_1.BatchesModule,
            system_module_1.SystemModule,
            campaign_automated_module_1.CampaignsModule,
        ],
        controllers: [app_controller_1.AppController, session_controller_1.SessionController],
        providers: [app_service_1.AppService],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map