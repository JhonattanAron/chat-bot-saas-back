import {
  IsString,
  IsNotEmpty,
  IsArray,
  IsOptional,
  ValidateNested,
  IsEnum,
  IsObject,
  IsNumber,
  IsBoolean,
} from "class-validator";
import { Type } from "class-transformer";

export class EmailConfigDto {
  @IsEnum(["gmail", "outlook", "smtp", "imap"])
  provider: "gmail" | "outlook" | "smtp" | "imap";

  @IsOptional()
  @IsString()
  smtpHost?: string;

  @IsOptional()
  @IsNumber()
  smtpPort?: number;

  @IsOptional()
  @IsString()
  imapHost?: string;

  @IsOptional()
  @IsNumber()
  imapPort?: number;

  @IsString()
  @IsNotEmpty()
  username: string;

  @IsString()
  @IsNotEmpty()
  password: string;

  @IsOptional()
  @IsBoolean()
  useSSL?: boolean;

  @IsOptional()
  @IsString()
  monitorFolder?: string;
}

export class EmailFilterDto {
  @IsEnum(["from", "to", "subject", "body", "attachment"])
  field: "from" | "to" | "subject" | "body" | "attachment";

  @IsEnum(["contains", "equals", "starts_with", "ends_with", "regex"])
  operator: "contains" | "equals" | "starts_with" | "ends_with" | "regex";

  @IsString()
  @IsNotEmpty()
  value: string;
}

export class EmailTemplateDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  subject: string;

  @IsString()
  @IsNotEmpty()
  body: string;

  @IsArray()
  @IsString({ each: true })
  variables: string[];
}

export class ClientDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  email: string;

  @IsOptional()
  @IsString()
  company?: string;

  @IsOptional()
  @IsObject()
  customFields?: Record<string, string>;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];
}

export class EmailCampaignDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ClientDto)
  clients: ClientDto[];

  @ValidateNested()
  @Type(() => EmailTemplateDto)
  template: EmailTemplateDto;

  @IsString()
  @IsNotEmpty()
  scheduledTime: string;

  @IsString()
  @IsNotEmpty()
  timezone: string;

  @IsOptional()
  @IsEnum(["draft", "scheduled", "sent", "completed"])
  status?: "draft" | "scheduled" | "sent" | "completed";

  @IsOptional()
  @IsBoolean()
  autoReplyEnabled?: boolean;

  @IsOptional()
  @ValidateNested()
  @Type(() => EmailTemplateDto)
  autoReplyTemplate?: EmailTemplateDto;
}

export class TaskActionDto {
  @IsEnum([
    "command",
    "api_call",
    "notification",
    "script",
    "email_reply",
    "email_send",
    "email_forward",
    "email_blast",
  ])
  type:
    | "command"
    | "api_call"
    | "notification"
    | "script"
    | "email_reply"
    | "email_send"
    | "email_forward"
    | "email_blast";

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsObject()
  config: any;
}

export class TaskTriggerDto {
  @IsEnum([
    "webhook",
    "schedule",
    "api_monitor",
    "log_monitor",
    "email_received",
    "custom",
    "scheduled_email_blast",
  ])
  type:
    | "webhook"
    | "schedule"
    | "api_monitor"
    | "log_monitor"
    | "email_received"
    | "custom"
    | "scheduled_email_blast";

  @IsObject()
  config: any;
}

export class TaskConditionDto {
  @IsString()
  @IsNotEmpty()
  field: string;

  @IsEnum(["equals", "contains", "greater_than", "less_than", "regex"])
  operator: "equals" | "contains" | "greater_than" | "less_than" | "regex";

  @IsString()
  @IsNotEmpty()
  value: string;
}

export class CreateAutomatedTaskDto {
  @IsString()
  @IsNotEmpty()
  user_id: string;

  @IsString()
  @IsNotEmpty()
  assistant_id: string;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsEnum([
    "server",
    "database",
    "security",
    "monitoring",
    "email",
    "custom",
    "marketing",
  ])
  category:
    | "server"
    | "database"
    | "security"
    | "monitoring"
    | "email"
    | "custom"
    | "marketing";

  @IsString()
  @IsNotEmpty()
  prompt: string;

  @ValidateNested()
  @Type(() => TaskTriggerDto)
  trigger: TaskTriggerDto;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TaskConditionDto)
  conditions?: TaskConditionDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TaskActionDto)
  actions?: TaskActionDto[];

  @IsOptional()
  @IsObject()
  variables?: Record<string, string>;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => EmailTemplateDto)
  emailTemplates?: EmailTemplateDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => EmailCampaignDto)
  emailCampaigns?: EmailCampaignDto[];
}

export class UpdateAutomatedTaskDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsEnum([
    "server",
    "database",
    "security",
    "monitoring",
    "email",
    "custom",
    "marketing",
  ])
  category?:
    | "server"
    | "database"
    | "security"
    | "monitoring"
    | "email"
    | "custom"
    | "marketing";

  @IsOptional()
  @IsString()
  prompt?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => TaskTriggerDto)
  trigger?: TaskTriggerDto;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TaskConditionDto)
  conditions?: TaskConditionDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TaskActionDto)
  actions?: TaskActionDto[];

  @IsOptional()
  @IsObject()
  variables?: Record<string, string>;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => EmailTemplateDto)
  emailTemplates?: EmailTemplateDto[];

  @IsOptional()
  @IsEnum(["active", "inactive", "error"])
  status?: "active" | "inactive" | "error";

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => EmailCampaignDto)
  emailCampaigns?: EmailCampaignDto[];
}
