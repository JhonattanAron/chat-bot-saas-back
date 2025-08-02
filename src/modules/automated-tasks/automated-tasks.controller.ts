import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  NotFoundException,
  BadRequestException,
  Body,
} from "@nestjs/common";
import { AutomatedTasksService } from "./automated-tasks.service";
import {
  CreateAutomatedTaskDto,
  UpdateAutomatedTaskDto,
} from "./dto/automated-task.dto";

@Controller("automated-tasks")
export class AutomatedTasksController {
  constructor(private readonly automatedTasksService: AutomatedTasksService) {}

  @Post()
  async createTask(@Body() createTaskDto: CreateAutomatedTaskDto) {
    try {
      const task = await this.automatedTasksService.createTask(createTaskDto);
      return {
        success: true,
        message: "Tarea creada exitosamente",
        task: {
          id: task._id,
          name: task.name,
          category: task.category,
          status: task.status,
        },
      };
    } catch (error) {
      throw new BadRequestException({
        success: false,
        error: error.message,
      });
    }
  }

  @Get()
  async getTasks(
    @Query("user_id") user_id: string,
    @Query("assistant_id") assistant_id?: string,
    @Query("category") category?: string,
    @Query("status") status?: string
  ) {
    if (!user_id) {
      throw new BadRequestException("user_id is required");
    }

    const tasks = await this.automatedTasksService.getTasks({
      user_id,
      assistant_id,
      category,
      status,
    });

    return {
      success: true,
      total: tasks.length,
      tasks,
    };
  }

  @Get(":id")
  async getTask(@Param("id") id: string, @Query("user_id") user_id: string) {
    if (!user_id) {
      throw new BadRequestException("user_id is required");
    }

    const task = await this.automatedTasksService.getTaskById(id, user_id);
    if (!task) {
      throw new NotFoundException("Task not found");
    }

    return {
      success: true,
      task,
    };
  }

  @Put(":id")
  async updateTask(
    @Param("id") id: string,
    @Query("user_id") user_id: string,
    updateTaskDto: UpdateAutomatedTaskDto
  ) {
    if (!user_id) {
      throw new BadRequestException("user_id is required");
    }

    const task = await this.automatedTasksService.updateTask(
      id,
      user_id,
      updateTaskDto
    );
    if (!task) {
      throw new NotFoundException("Task not found");
    }

    return {
      success: true,
      message: "Tarea actualizada exitosamente",
      task: {
        id: task._id,
        name: task.name,
        status: task.status,
      },
    };
  }

  @Delete(":id")
  @HttpCode(HttpStatus.OK)
  async deleteTask(@Param("id") id: string, @Query("user_id") user_id: string) {
    if (!user_id) {
      throw new BadRequestException("user_id is required");
    }

    const result = await this.automatedTasksService.deleteTask(id, user_id);
    if (!result) {
      throw new NotFoundException("Task not found");
    }

    return {
      success: true,
      message: "Tarea eliminada exitosamente",
    };
  }

  @Post(":id/toggle-status")
  async toggleTaskStatus(
    @Param("id") id: string,
    @Query("user_id") user_id: string
  ) {
    if (!user_id) {
      throw new BadRequestException("user_id is required");
    }

    const task = await this.automatedTasksService.toggleTaskStatus(id, user_id);
    if (!task) {
      throw new NotFoundException("Task not found");
    }

    return {
      success: true,
      message: `Tarea ${task.status === "active" ? "activada" : "desactivada"} exitosamente`,
      task: {
        id: task._id,
        name: task.name,
        status: task.status,
      },
    };
  }

  @Post(":id/execute")
  async executeTask(
    @Param("id") id: string,
    @Query("user_id") user_id: string,
    context?: any
  ) {
    if (!user_id) {
      throw new BadRequestException("user_id is required");
    }

    try {
      const result = await this.automatedTasksService.executeTask(
        id,
        user_id,
        context
      );
      return {
        success: true,
        message: "Tarea ejecutada exitosamente",
        result,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  @Get(":id/logs")
  async getTaskLogs(
    @Param("id") id: string,
    @Query("user_id") user_id: string,
    @Query("limit") limit: string = "50"
  ) {
    if (!user_id) {
      throw new BadRequestException("user_id is required");
    }

    const logs = await this.automatedTasksService.getTaskLogs(
      id,
      user_id,
      Number.parseInt(limit)
    );
    return {
      success: true,
      logs,
    };
  }

  @Post("test-email")
  async testEmailConnection(emailConfig: any) {
    try {
      const result =
        await this.automatedTasksService.testEmailConnection(emailConfig);
      return {
        success: true,
        message: "Conexión de email exitosa",
        result,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  @Post("webhook/:taskId")
  async handleWebhook(@Param("taskId") taskId: string, payload: any) {
    try {
      const result = await this.automatedTasksService.handleWebhookTrigger(
        taskId,
        payload
      );
      return {
        success: true,
        message: "Webhook procesado exitosamente",
        result,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }
}
