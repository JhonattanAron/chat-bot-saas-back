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
exports.FaqsSchema = exports.Faqs = exports.FaqItem = void 0;
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
let FaqItem = class FaqItem {
};
exports.FaqItem = FaqItem;
__decorate([
    (0, mongoose_1.Prop)({ type: mongoose_2.Schema.Types.ObjectId, auto: true }),
    __metadata("design:type", mongoose_2.Schema.Types.ObjectId)
], FaqItem.prototype, "_id", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", String)
], FaqItem.prototype, "question", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", String)
], FaqItem.prototype, "answer", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", String)
], FaqItem.prototype, "category", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: [Number], default: [] }),
    __metadata("design:type", Array)
], FaqItem.prototype, "embedding", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Date, default: Date.now }),
    __metadata("design:type", Date)
], FaqItem.prototype, "createdAt", void 0);
exports.FaqItem = FaqItem = __decorate([
    (0, mongoose_1.Schema)({ _id: false })
], FaqItem);
const FaqItemSchema = mongoose_1.SchemaFactory.createForClass(FaqItem);
let Faqs = class Faqs {
};
exports.Faqs = Faqs;
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", String)
], Faqs.prototype, "user_id", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", String)
], Faqs.prototype, "assistant_id", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: [FaqItemSchema], required: true }),
    __metadata("design:type", Array)
], Faqs.prototype, "faqs", void 0);
exports.Faqs = Faqs = __decorate([
    (0, mongoose_1.Schema)()
], Faqs);
exports.FaqsSchema = mongoose_1.SchemaFactory.createForClass(Faqs);
//# sourceMappingURL=faqs.schema.js.map