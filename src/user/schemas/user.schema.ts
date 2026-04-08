import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type UserDocument = HydratedDocument<User>;

@Schema({
  timestamps: true,
})
export class User {
  @Prop({ required: true, trim: true, unique: true })
  username: string;

  @Prop({ required: false, lowercase: true, trim: true, unique: true })
  email?: string;

  @Prop({ required: true })
  password: string;

  @Prop({ required: false, default: '' })
  avatar?: string;
}

export const UserSchema = SchemaFactory.createForClass(User);
