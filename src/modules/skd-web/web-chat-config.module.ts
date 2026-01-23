import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { WebChatConfig, WebChatConfigSchema } from './schemas/web-chat-config.schema';
import { WebChatConfigService } from './web-chat-config.service';
import { WebChatConfigController } from './web-chat-config.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: WebChatConfig.name, schema: WebChatConfigSchema },
    ]),
  ],
  controllers: [WebChatConfigController],
  providers: [WebChatConfigService],
  exports: [WebChatConfigService],
})
export class WebChatConfigModule {}
