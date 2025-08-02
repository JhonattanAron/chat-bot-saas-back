import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { AutomatedTasksController } from "./automated-tasks.controller";
import { AutomatedTasksService } from "./automated-tasks.service";
import { TaskExecutionService } from "./services/task-execution.service";
import { EmailService } from "./services/email.service";
import { SystemCommandService } from "./services/system-command.service";
import { NotificationService } from "./services/notification.service";
import { TaskLogService } from "./services/task-log.service";
import {
  AutomatedTask,
  AutomatedTaskSchema,
} from "./schemas/automated-task.schema";
import { TaskLog, TaskLogSchema } from "./schemas/task-log.schema";
import { ChatModule } from "../chat-model/chat/chat.module";

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: AutomatedTask.name, schema: AutomatedTaskSchema },
      { name: TaskLog.name, schema: TaskLogSchema },
    ]),
    ChatModule,
  ],
  controllers: [AutomatedTasksController],
  providers: [
    AutomatedTasksService,
    TaskExecutionService,
    EmailService,
    SystemCommandService,
    NotificationService,
    TaskLogService,
  ],
  exports: [AutomatedTasksService, TaskExecutionService],
})
export class AutomatedTasksModule {}
