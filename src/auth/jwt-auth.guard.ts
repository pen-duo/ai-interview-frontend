import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

// JwtAuthGuard 用来“启用 jwt 认证”。
// 当接口上使用 @UseGuards(JwtAuthGuard) 时，
// Nest 会调用 Passport 的 jwt 策略，也就是你写的 JwtStrategy。
// 如果 token 合法，请求会继续进入控制器；否则会直接返回 401。
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}
