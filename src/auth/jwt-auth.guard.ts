import {
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from './public.decorator';

// JwtAuthGuard 是“接口门卫”：
// - 默认情况下，它会要求请求必须带合法的 JWT token
// - token 合法，请求继续往下走
// - token 不合法或没传，请求会被拦住，直接返回 401
//
// 它继承自 AuthGuard('jwt')，
// 也就是把 Passport 里名为 jwt 的认证策略接进来。
// 真正怎么解析 token、怎么验签，是 JwtStrategy 在负责。
//
// 但我们这里又额外加了一层“特判”：
// 如果某个接口被 @Public() 标记了，就直接放行，不做 JWT 校验。
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private readonly reflector: Reflector) {
    super();
  }

  canActivate(context: ExecutionContext) {
    // reflector.getAllAndOverride(...) 的作用是：
    // 去当前“方法”和“控制器类”上找 isPublic 这个标记。
    //
    // 查找顺序是：
    // 1. 先看当前方法上有没有
    // 2. 再看当前控制器类上有没有
    //
    // 只要找到一个 true，就说明这个接口是公开的。
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      // 命中了 @Public()，直接放行。
      // 这里 return true 就表示：
      // “这个请求不用再走 JWT 认证了，继续执行 controller。”
      return true;
    }

    // 没命中 @Public()，就走默认的 jwt 认证流程。
    // 这里会触发 Passport -> JwtStrategy：
    // 1. 从请求头里取 Bearer Token
    // 2. 校验 token 是否合法、是否过期
    // 3. 校验通过后，把用户信息挂到 req.user
    return super.canActivate(context);
  }

  // handleRequest 会在 Passport 完成认证后被调用。
  // 我们可以在这里把默认报错改成更容易看懂的中文提示。
  handleRequest<TUser = unknown>(
    err: unknown,
    user: TUser,
    info: { name?: string; message?: string } | undefined,
  ): TUser {
    if (err) {
      if (err instanceof Error) {
        throw err;
      }

      throw new UnauthorizedException('认证失败，请重新登录');
    }

    if (!user) {
      if (info?.name === 'TokenExpiredError') {
        throw new UnauthorizedException('登录已过期，请重新登录');
      }

      if (info?.name === 'JsonWebTokenError') {
        throw new UnauthorizedException('无效的 token，请重新登录');
      }

      if (info?.message?.includes('No auth token')) {
        throw new UnauthorizedException('未提供 token，请先登录');
      }

      throw new UnauthorizedException('认证失败，请检查登录状态');
    }

    return user;
  }
}
