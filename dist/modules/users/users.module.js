"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UsersModule = void 0;
const common_1 = require("@nestjs/common");
const users_service_1 = require("./users.service");
const users_controller_1 = require("./users.controller");
const mongoose_1 = require("@nestjs/mongoose");
const assistant_chat_schema_1 = require("./schemas/assistant-chat.schema");
const UserSchema_1 = require("./schemas/UserSchema");
const faqs_schema_1 = require("../faqs/schema/faqs.schema");
const faqs_module_1 = require("../faqs/faqs.module");
let UsersModule = class UsersModule {
};
exports.UsersModule = UsersModule;
exports.UsersModule = UsersModule = __decorate([
    (0, common_1.Module)({
        imports: [
            mongoose_1.MongooseModule.forFeature([
                { name: assistant_chat_schema_1.AssistantChat.name, schema: assistant_chat_schema_1.AssistantChatSchema },
            ]),
            mongoose_1.MongooseModule.forFeature([{ name: UserSchema_1.User.name, schema: UserSchema_1.UserSchema }]),
            mongoose_1.MongooseModule.forFeature([{ name: faqs_schema_1.Faqs.name, schema: faqs_schema_1.FaqsSchema }]),
            faqs_module_1.FaqsModule,
        ],
        providers: [users_service_1.UsersService],
        controllers: [users_controller_1.UsersController],
        exports: [users_service_1.UsersService],
    })
], UsersModule);
//# sourceMappingURL=users.module.js.map