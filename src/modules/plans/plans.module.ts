import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { PlansController } from "./plans.controller";
import { PlansService } from "./plans.service";
import {
  StickReferences,
  StickReferencesSchema,
} from "./stick-references.schema";

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: StickReferences.name, schema: StickReferencesSchema },
    ]),
  ],
  controllers: [PlansController],
  providers: [PlansService],
  exports: [PlansService, MongooseModule],
})
export class PlansModule {}
