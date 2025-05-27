import { Module } from "@nestjs/common";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { SessionController } from "./modules/session/session.controller";
import { MongooseModule } from "@nestjs/mongoose";
import { ProductsModule } from './modules/products/products.module';
import { MemoryController } from './modules/chat-model/memory/memory.controller';
import { MemoryService } from './modules/chat-model/memory/memory.service';
import { MemoryModule } from './modules/chat-model/memory/memory.module';

@Module({
  imports: [MongooseModule.forRoot("mongodb://localhost:27017/chatbot_sass"), ProductsModule, MemoryModule],
  controllers: [AppController, SessionController, MemoryController],
  providers: [AppService, MemoryService],
})
export class AppModule {}
