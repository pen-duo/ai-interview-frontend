import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type UserDocument = HydratedDocument<User>;

@Schema({
  timestamps: true,
})
export class User {
  // ----基础认证字段----
  @Prop({ required: true })
  username: string; // 用户名

  @Prop()
  password: string; // 登录密码

  @Prop({ required: false, default: ['user'] })
  roles: string[]; // 用户角色

  @Prop({ default: false })
  isActive: boolean; // 账号是否激活

  @Prop({ required: false })
  wechatId: string; // 微信登录的唯一标识

  @Prop({ required: false })
  email?: string; // 用户邮箱

  @Prop({ required: false })
  phone: string; // 用户手机号

  @Prop()
  avatar?: string; // 用户头像

  // ----用户个人信息----
  @Prop()
  realName?: string; // 真实姓名

  @Prop({ enum: ['male', 'female', 'other'], default: 'other' })
  gender?: 'male' | 'female' | 'other'; // 性别

  @Prop()
  idCard?: string; // 身份证号

  @Prop({ default: false })
  isVerified: boolean; // 是否实名认证

  @Prop()
  birthDate?: Date; // 出生年月日

  // ----VIP 相关----
  @Prop({ default: false })
  isVip: boolean; // 是否为会员

  @Prop()
  vipExpireTime?: Date; // 会员过期时间

  // 配额相关
  @Prop({ default: 0 })
  aiInterviewRemainingCount: number; // AI模拟面试剩余次数

  @Prop({ default: 0 })
  aiInterviewRemainingMinutes: number; // AI模拟面试剩余时间（分钟）

  @Prop({ default: 0 })
  wwCoinBalance: number; // 旺旺币余额

  @Prop({ default: 0 })
  resumeRemainingCount: number; // 简历押题剩余次数

  @Prop({ default: 0 })
  specialRemainingCount: number; // 专项面试剩余次数

  @Prop({ default: 0 })
  behaviorRemainingCount: number; // 综合面试剩余次数

  // ----幂等性保证：记录已处理的订单号，防止重复发放权益----
  @Prop({ type: [String], default: [] })
  processedOrders: string[]; // 已处理的订单号列表

  // ----用户行为追踪----
  @Prop()
  lastLoginTime?: Date; // 最近登录时间

  @Prop()
  lastLoginLocation?: string; // 最近登录地点

  // ----微信相关字段----
  @Prop({ unique: true, sparse: true }) // unique: true, sparse: true 表示索引是唯一的，并且可以为空
  openid?: string; // 微信用户的唯一标识（小程序）

  @Prop({ unique: true, sparse: true })
  unionid?: string; // 微信开放平台统一标识

  @Prop()
  wechatNickname?: string; // 微信昵称

  @Prop()
  wechatAvatar?: string; // 微信头像

  @Prop({ default: false })
  isWechatBound: boolean; // 是否绑定微信

  @Prop()
  wechatBoundTime?: Date; // 微信绑定时间
}

export const UserSchema = SchemaFactory.createForClass(User);
