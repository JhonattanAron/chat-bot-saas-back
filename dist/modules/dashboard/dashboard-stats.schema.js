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
exports.DashboardStatsSchema = exports.DashboardStats = void 0;
const mongoose_1 = require("@nestjs/mongoose");
let DashboardStats = class DashboardStats {
};
exports.DashboardStats = DashboardStats;
__decorate([
    (0, mongoose_1.Prop)({ required: true, type: String }),
    __metadata("design:type", String)
], DashboardStats.prototype, "user_id", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: 0 }),
    __metadata("design:type", Number)
], DashboardStats.prototype, "total_input_tokens", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: 0 }),
    __metadata("design:type", Number)
], DashboardStats.prototype, "total_output_tokens", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: 0 }),
    __metadata("design:type", Number)
], DashboardStats.prototype, "monthly_input_tokens", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: 0 }),
    __metadata("design:type", Number)
], DashboardStats.prototype, "monthly_output_tokens", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: 0 }),
    __metadata("design:type", Number)
], DashboardStats.prototype, "total_bots_created", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: 0 }),
    __metadata("design:type", Number)
], DashboardStats.prototype, "active_bots", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: 0 }),
    __metadata("design:type", Number)
], DashboardStats.prototype, "deleted_bots", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: 0 }),
    __metadata("design:type", Number)
], DashboardStats.prototype, "total_conversations", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: 0 }),
    __metadata("design:type", Number)
], DashboardStats.prototype, "monthly_conversations", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: 0 }),
    __metadata("design:type", Number)
], DashboardStats.prototype, "total_messages", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: 0 }),
    __metadata("design:type", Number)
], DashboardStats.prototype, "monthly_messages", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: 0 }),
    __metadata("design:type", Number)
], DashboardStats.prototype, "unique_users_interacted", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Date, default: Date.now }),
    __metadata("design:type", Date)
], DashboardStats.prototype, "last_monthly_reset", void 0);
__decorate([
    (0, mongoose_1.Prop)({
        type: [
            {
                month: String,
                input_tokens: Number,
                output_tokens: Number,
                conversations: Number,
                messages: Number,
                bots_created: Number,
                bots_deleted: Number,
            },
        ],
        default: [],
    }),
    __metadata("design:type", Array)
], DashboardStats.prototype, "monthly_history", void 0);
__decorate([
    (0, mongoose_1.Prop)({
        type: [
            {
                chat_id: String,
                last_input_tokens: Number,
                last_output_tokens: Number,
            },
        ],
        default: [],
    }),
    __metadata("design:type", Array)
], DashboardStats.prototype, "counted_chats", void 0);
exports.DashboardStats = DashboardStats = __decorate([
    (0, mongoose_1.Schema)({ timestamps: true })
], DashboardStats);
exports.DashboardStatsSchema = mongoose_1.SchemaFactory.createForClass(DashboardStats);
//# sourceMappingURL=dashboard-stats.schema.js.map