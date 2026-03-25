import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { Usage, UsageSchema } from "./usage.schema";
import { UsageService } from "./usage.service";

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Usage.name, schema: UsageSchema }]),
  ],
  providers: [UsageService],
  exports: [UsageService],
})
export class UsageModule {}
