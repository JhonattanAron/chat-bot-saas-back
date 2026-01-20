"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FunctionSchemaSchema = exports.FunctionSchema = exports.FunctionItemSchema = exports.FunctionItem = exports.FunctionCredential = exports.ApiConfig = exports.ApiAuth = exports.ApiHeader = exports.ApiParameter = void 0;
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
let ApiParameter = class ApiParameter {
};
exports.ApiParameter = ApiParameter;
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", String)
], ApiParameter.prototype, "name", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", String)
], ApiParameter.prototype, "type", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", Boolean)
], ApiParameter.prototype, "required", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", String)
], ApiParameter.prototype, "description", void 0);
exports.ApiParameter = ApiParameter = __decorate([
    (0, mongoose_1.Schema)({ _id: false })
], ApiParameter);
const ApiParameterSchema = mongoose_1.SchemaFactory.createForClass(ApiParameter);
let ApiHeader = class ApiHeader {
};
exports.ApiHeader = ApiHeader;
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", String)
], ApiHeader.prototype, "key", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", String)
], ApiHeader.prototype, "value", void 0);
exports.ApiHeader = ApiHeader = __decorate([
    (0, mongoose_1.Schema)({ _id: false })
], ApiHeader);
const ApiHeaderSchema = mongoose_1.SchemaFactory.createForClass(ApiHeader);
let ApiAuth = class ApiAuth {
};
exports.ApiAuth = ApiAuth;
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", String)
], ApiAuth.prototype, "type", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", String)
], ApiAuth.prototype, "value", void 0);
exports.ApiAuth = ApiAuth = __decorate([
    (0, mongoose_1.Schema)({ _id: false })
], ApiAuth);
const ApiAuthSchema = mongoose_1.SchemaFactory.createForClass(ApiAuth);
let ApiConfig = class ApiConfig {
};
exports.ApiConfig = ApiConfig;
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", String)
], ApiConfig.prototype, "url", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", String)
], ApiConfig.prototype, "method", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: [ApiHeaderSchema], default: [] }),
    __metadata("design:type", Array)
], ApiConfig.prototype, "headers", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: [ApiParameterSchema], default: [] }),
    __metadata("design:type", Array)
], ApiConfig.prototype, "parameters", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: ApiAuthSchema }),
    __metadata("design:type", ApiAuth)
], ApiConfig.prototype, "auth", void 0);
exports.ApiConfig = ApiConfig = __decorate([
    (0, mongoose_1.Schema)({ _id: false })
], ApiConfig);
const ApiConfigSchema = mongoose_1.SchemaFactory.createForClass(ApiConfig);
let FunctionCredential = class FunctionCredential {
};
exports.FunctionCredential = FunctionCredential;
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", String)
], FunctionCredential.prototype, "name", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", String)
], FunctionCredential.prototype, "value", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", String)
], FunctionCredential.prototype, "description", void 0);
exports.FunctionCredential = FunctionCredential = __decorate([
    (0, mongoose_1.Schema)({ _id: false })
], FunctionCredential);
const FunctionCredentialSchema = mongoose_1.SchemaFactory.createForClass(FunctionCredential);
let FunctionItem = class FunctionItem {
};
exports.FunctionItem = FunctionItem;
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", String)
], FunctionItem.prototype, "name", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", String)
], FunctionItem.prototype, "description", void 0);
__decorate([
    (0, mongoose_1.Prop)({ enum: ["api", "custom"], required: true }),
    __metadata("design:type", String)
], FunctionItem.prototype, "type", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: ApiConfigSchema }),
    __metadata("design:type", ApiConfig)
], FunctionItem.prototype, "api", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", String)
], FunctionItem.prototype, "code", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: [FunctionCredentialSchema], default: [] }),
    __metadata("design:type", Array)
], FunctionItem.prototype, "credentials", void 0);
exports.FunctionItem = FunctionItem = __decorate([
    (0, mongoose_1.Schema)()
], FunctionItem);
exports.FunctionItemSchema = mongoose_1.SchemaFactory.createForClass(FunctionItem);
let FunctionSchema = class FunctionSchema {
};
exports.FunctionSchema = FunctionSchema;
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", String)
], FunctionSchema.prototype, "user_id", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: mongoose_2.Schema.Types.ObjectId, ref: "AssistantChat" }),
    __metadata("design:type", mongoose_2.Schema.Types.ObjectId)
], FunctionSchema.prototype, "assistant_id", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: [exports.FunctionItemSchema], required: true }),
    __metadata("design:type", Array)
], FunctionSchema.prototype, "functions", void 0);
exports.FunctionSchema = FunctionSchema = __decorate([
    (0, mongoose_1.Schema)()
], FunctionSchema);
exports.FunctionSchemaSchema = mongoose_1.SchemaFactory.createForClass(FunctionSchema);
//# sourceMappingURL=functions-schema.js.map