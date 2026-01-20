"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatModule = void 0;
const common_1 = require("@nestjs/common");
const chat_service_1 = require("./chat.service");
const chat_controller_1 = require("./chat.controller");
const mongoose_1 = require("@nestjs/mongoose");
const chat_schema_1 = require("../schemas/chat.schema");
const prompt_generator_service_1 = require("../config/prompt-generator.service");
const chat_cleanup_service_1 = require("../config/chat-cleanup.service");
const predictions_service_1 = require("../model-ai/predictions.service");
const products_service_1 = require("../../products/products.service");
const product_schema_1 = require("../../products/schemas/product.schema");
const assistant_chat_schema_1 = require("../../users/schemas/assistant-chat.schema");
const users_service_1 = require("../../users/users.service");
const UserSchema_1 = require("../../users/schemas/UserSchema");
const faqs_module_1 = require("../../faqs/faqs.module");
const custom_function_service_1 = require("../services/custom-function.service");
const plans_module_1 = require("../../plans/plans.module");
const stick_references_schema_1 = require("../../plans/stick-references.schema");
const predictionlargue_service_1 = require("../model-ai/predictionlargue.service");
let ChatModule = class ChatModule {
};
exports.ChatModule = ChatModule;
exports.ChatModule = ChatModule = __decorate([
    (0, common_1.Module)({
        imports: [
            mongoose_1.MongooseModule.forFeature([{ name: chat_schema_1.Chat.name, schema: chat_schema_1.ChatSchema }]),
            mongoose_1.MongooseModule.forFeature([{ name: product_schema_1.Product.name, schema: product_schema_1.ProductSchema }]),
            mongoose_1.MongooseModule.forFeature([
                { name: assistant_chat_schema_1.AssistantChat.name, schema: assistant_chat_schema_1.AssistantChatSchema },
            ]),
            mongoose_1.MongooseModule.forFeature([{ name: UserSchema_1.User.name, schema: UserSchema_1.UserSchema }]),
            mongoose_1.MongooseModule.forFeature([
                { name: stick_references_schema_1.StickReferences.name, schema: stick_references_schema_1.StickReferencesSchema },
            ]),
            faqs_module_1.FaqsModule,
            plans_module_1.PlansModule,
        ],
        providers: [
            chat_service_1.ChatService,
            prompt_generator_service_1.PromptGeneratorService,
            predictionlargue_service_1.PredictionLargueService,
            chat_cleanup_service_1.ChatCleanupService,
            predictions_service_1.PredictionService,
            products_service_1.ProductsService,
            users_service_1.UsersService,
            custom_function_service_1.CustomFunctionService,
        ],
        controllers: [chat_controller_1.ChatController],
        exports: [chat_service_1.ChatService],
    })
], ChatModule);
//# sourceMappingURL=chat.module.js.map