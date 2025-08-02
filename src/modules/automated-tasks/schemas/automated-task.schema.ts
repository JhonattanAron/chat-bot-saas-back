import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { type Document, Schema as MongooseSchema } from "mongoose";

// Email Configuration Schema
@Schema({ _id: false })
export class EmailConfig {
  @Prop({ enum: ["gmail", "outlook", "smtp", "imap"], required: true })
  provider: "gmail" | "outlook" | "smtp" | "imap";

  @Prop()
  smtpHost?: string;

  @Prop()
  smtpPort?: number;

  @Prop()
  imapHost?: string;

  @Prop()
  imapPort?: number;

  @Prop({ required: true })
  username: string;

  @Prop({ required: true })
  password: string;

  @Prop({ default: true })
  useSSL: boolean;

  @Prop({ default: "INBOX" })
  monitorFolder?: string;
}

const EmailConfigSchema = SchemaFactory.createForClass(EmailConfig);

// Email Filter Schema
@Schema({ _id: false })
export class EmailFilter {
  @Prop({
    enum: ["from", "to", "subject", "body", "attachment"],
    required: true,
  })
  field: "from" | "to" | "subject" | "body" | "attachment";

  @Prop({
    enum: ["contains", "equals", "starts_with", "ends_with", "regex"],
    required: true,
  })
  operator: "contains" | "equals" | "starts_with" | "ends_with" | "regex";

  @Prop({ required: true })
  value: string;
}

const EmailFilterSchema = SchemaFactory.createForClass(EmailFilter);

// Email Template Schema
@Schema({ _id: false })
export class EmailTemplate {
  @Prop({ type: MongooseSchema.Types.ObjectId, auto: true })
  _id?: MongooseSchema.Types.ObjectId;

  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  subject: string;

  @Prop({ required: true })
  body: string;

  @Prop({ type: [String], default: [] })
  variables: string[];
}

const EmailTemplateSchema = SchemaFactory.createForClass(EmailTemplate);

// Client Schema
@Schema({ _id: false })
export class Client {
  @Prop({ type: MongooseSchema.Types.ObjectId, auto: true })
  _id?: MongooseSchema.Types.ObjectId;

  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  email: string;

  @Prop()
  company?: string;

  @Prop({ type: MongooseSchema.Types.Mixed, default: {} })
  customFields: Record<string, string>;

  @Prop()
  lastEmailSent?: string;

  @Prop({ default: false })
  responseReceived?: boolean;

  @Prop({ type: [String], default: [] })
  tags: string[];
}

const ClientSchema = SchemaFactory.createForClass(Client);

// Email Campaign Schema
@Schema({ _id: false })
export class EmailCampaign {
  @Prop({ type: MongooseSchema.Types.ObjectId, auto: true })
  _id?: MongooseSchema.Types.ObjectId;

  @Prop({ required: true })
  name: string;

  @Prop({ type: [ClientSchema], default: [] })
  clients: Client[];

  @Prop({ type: EmailTemplateSchema, required: true })
  template: EmailTemplate;

  @Prop({ required: true })
  scheduledTime: string;

  @Prop({ required: true })
  timezone: string;

  @Prop({ enum: ["draft", "scheduled", "sent", "completed"], default: "draft" })
  status: "draft" | "scheduled" | "sent" | "completed";

  @Prop({ default: 0 })
  sentCount: number;

  @Prop({ default: 0 })
  responseCount: number;

  @Prop({ default: false })
  autoReplyEnabled: boolean;

  @Prop({ type: EmailTemplateSchema })
  autoReplyTemplate?: EmailTemplate;
}

const EmailCampaignSchema = SchemaFactory.createForClass(EmailCampaign);

// Task Action Schema
@Schema({ _id: false })
export class TaskAction {
  @Prop({ type: MongooseSchema.Types.ObjectId, auto: true })
  _id?: MongooseSchema.Types.ObjectId;

  @Prop({
    enum: [
      "command",
      "api_call",
      "notification",
      "script",
      "email_reply",
      "email_send",
      "email_forward",
      "email_blast",
    ],
    required: true,
  })
  type:
    | "command"
    | "api_call"
    | "notification"
    | "script"
    | "email_reply"
    | "email_send"
    | "email_forward"
    | "email_blast";

  @Prop({ required: true })
  name: string;

  @Prop({
    type: MongooseSchema.Types.Mixed,
    default: {},
  })
  config: {
    command?: string;
    script?: string;
    apiUrl?: string;
    method?: string;
    headers?: Record<string, string>;
    body?: string;
    notificationMessage?: string;
    emailTemplate?: string;
    emailTo?: string;
    emailSubject?: string;
    emailBody?: string;
    replyTemplate?: string;
    forwardTo?: string;
    attachOriginal?: boolean;
    campaign?: EmailCampaign;
    delayBetweenEmails?: number;
    trackOpens?: boolean;
    trackClicks?: boolean;
  };
}

const TaskActionSchema = SchemaFactory.createForClass(TaskAction);

// Task Trigger Schema
@Schema({ _id: false })
export class TaskTrigger {
  @Prop({
    enum: [
      "webhook",
      "schedule",
      "api_monitor",
      "log_monitor",
      "email_received",
      "custom",
      "scheduled_email_blast",
    ],
    required: true,
  })
  type:
    | "webhook"
    | "schedule"
    | "api_monitor"
    | "log_monitor"
    | "email_received"
    | "custom"
    | "scheduled_email_blast";

  @Prop({
    type: MongooseSchema.Types.Mixed,
    default: {},
  })
  config: {
    webhookUrl?: string;
    schedule?: string;
    apiUrl?: string;
    logPath?: string;
    condition?: string;
    customTrigger?: string;
    emailConfig?: EmailConfig;
    emailFilters?: EmailFilter[];
    checkInterval?: number;
    timezone?: string;
    scheduledTime?: string;
  };
}

const TaskTriggerSchema = SchemaFactory.createForClass(TaskTrigger);

// Task Condition Schema
@Schema({ _id: false })
export class TaskCondition {
  @Prop({ required: true })
  field: string;

  @Prop({
    enum: ["equals", "contains", "greater_than", "less_than", "regex"],
    required: true,
  })
  operator: "equals" | "contains" | "greater_than" | "less_than" | "regex";

  @Prop({ required: true })
  value: string;
}

const TaskConditionSchema = SchemaFactory.createForClass(TaskCondition);

// Main Automated Task Schema
@Schema({ timestamps: true })
export class AutomatedTask {
  @Prop({ required: true })
  user_id: string;

  @Prop({ required: true })
  assistant_id: string;

  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  description: string;

  @Prop({
    enum: [
      "server",
      "database",
      "security",
      "monitoring",
      "email",
      "custom",
      "marketing",
    ],
    required: true,
  })
  category:
    | "server"
    | "database"
    | "security"
    | "monitoring"
    | "email"
    | "custom"
    | "marketing";

  @Prop({ required: true })
  prompt: string;

  @Prop({ type: TaskTriggerSchema, required: true })
  trigger: TaskTrigger;

  @Prop({ type: [TaskConditionSchema], default: [] })
  conditions: TaskCondition[];

  @Prop({ type: [TaskActionSchema], default: [] })
  actions: TaskAction[];

  @Prop({ type: MongooseSchema.Types.Mixed, default: {} })
  variables: Record<string, string>;

  @Prop({ type: [EmailTemplateSchema], default: [] })
  emailTemplates?: EmailTemplate[];

  @Prop({ enum: ["active", "inactive", "error"], default: "inactive" })
  status: "active" | "inactive" | "error";

  @Prop()
  lastRun?: Date;

  @Prop({ default: 0 })
  runCount: number;

  @Prop({ type: [EmailCampaignSchema], default: [] })
  emailCampaigns?: EmailCampaign[];

  @Prop()
  lastError?: string;

  @Prop({ default: Date.now })
  createdAt: Date;

  @Prop({ default: Date.now })
  updatedAt: Date;
}

export type AutomatedTaskDocument = AutomatedTask & Document;
export const AutomatedTaskSchema = SchemaFactory.createForClass(AutomatedTask);
