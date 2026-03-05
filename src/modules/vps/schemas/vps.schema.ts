import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document } from "mongoose";

export type VpsDocument = Vps & Document;

export enum VpsStatus {
  RUNNING = "running",
  STOPPED = "stopped",
  MAINTENANCE = "maintenance",
}

@Schema({ timestamps: true })
export class Vps {
  @Prop({ required: true })
  userId: string; // dueño del VPS

  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  ip: string;

  @Prop({ required: true })
  sshUser: string;

  @Prop({ required: true })
  sshPassword: string;

  @Prop({ enum: VpsStatus, default: VpsStatus.STOPPED })
  status: VpsStatus;

  @Prop()
  cpu: number;

  @Prop()
  memory: number;

  @Prop()
  storage: number;

  @Prop()
  region: string;

  @Prop()
  os: string;

  @Prop()
  cores: number;

  @Prop()
  ram: string;

  @Prop()
  price: number;

  @Prop({ default: "0 días" })
  uptime: string;

  @Prop({ default: Date.now })
  lastUpdate: Date;
}

export const VpsSchema = SchemaFactory.createForClass(Vps);
