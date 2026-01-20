"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BatchesModule = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const batches_service_1 = require("./batches.service");
const batches_controller_1 = require("./batches.controller");
const batches_schema_1 = require("./batches.schema");
const google_service_1 = require("./google.service");
const plain_text_export_schema_1 = require("./plain-text-export.schema");
const chat_module_1 = require("../chat-model/chat/chat.module");
const utils_1 = require("./lib/utils");
let BatchesModule = class BatchesModule {
};
exports.BatchesModule = BatchesModule;
exports.BatchesModule = BatchesModule = __decorate([
    (0, common_1.Module)({
        imports: [
            mongoose_1.MongooseModule.forFeature([
                { name: "Lead", schema: require("./lead.schema").LeadSchema },
            ]),
            mongoose_1.MongooseModule.forFeature([{ name: batches_schema_1.Batch.name, schema: batches_schema_1.BatchSchema }]),
            mongoose_1.MongooseModule.forFeature([
                { name: plain_text_export_schema_1.PlainTextExport.name, schema: plain_text_export_schema_1.PlainTextExportSchema },
            ]),
            chat_module_1.ChatModule,
        ],
        controllers: [batches_controller_1.BatchesController],
        providers: [batches_service_1.BatchesService, google_service_1.GoogleService, utils_1.EmailPromptService],
        exports: [batches_service_1.BatchesService],
    })
], BatchesModule);
//# sourceMappingURL=batches.module.js.map