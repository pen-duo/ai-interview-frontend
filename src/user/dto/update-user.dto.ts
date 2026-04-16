import { IsString, IsOptional, IsEmail } from 'class-validator';

export class UpdateUserDto {
  @IsString()
  @IsOptional()
  nickname?: string; // 昵称

  @IsString()
  @IsOptional()
  avatar?: string; // 头像

  @IsEmail()
  @IsOptional()
  email?: string; // 邮箱

  @IsString()
  @IsOptional()
  phone?: string; // 手机号
}
