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
exports.PlainTextExportSchema = exports.PlainTextExport = void 0;
const mongoose_1 = require("@nestjs/mongoose");
let PlainTextExport = class PlainTextExport {
};
exports.PlainTextExport = PlainTextExport;
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", String)
], PlainTextExport.prototype, "filename", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", String)
], PlainTextExport.prototype, "batch_id", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", String)
], PlainTextExport.prototype, "content", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: false, default: false }),
    __metadata("design:type", Boolean)
], PlainTextExport.prototype, "analized", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: false, default: "" }),
    __metadata("design:type", String)
], PlainTextExport.prototype, "analized_data", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: Date.now }),
    __metadata("design:type", Date)
], PlainTextExport.prototype, "createdAt", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: Date.now }),
    __metadata("design:type", Date)
], PlainTextExport.prototype, "updatedAt", void 0);
exports.PlainTextExport = PlainTextExport = __decorate([
    (0, mongoose_1.Schema)({ timestamps: true })
], PlainTextExport);
exports.PlainTextExportSchema = mongoose_1.SchemaFactory.createForClass(PlainTextExport);
//# sourceMappingURL=plain-text-export.schema.js.map