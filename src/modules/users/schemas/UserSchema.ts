import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document } from "mongoose";

@Schema()
export class User extends Document {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true, unique: true })
  email: string;

  @Prop({
    required: function (this: User) {
      return !this.googleId;
    },
  })
  password: string;

  @Prop()
  googleId: string;

  @Prop()
  image: string;
}

export const UserSchema = SchemaFactory.createForClass(User);
