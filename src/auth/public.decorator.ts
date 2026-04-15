import { SetMetadata } from '@nestjs/common';

// 这是我们自己约定的“标记名”。
// 后面只要谁读取到这个 key，并且值为 true，
// 就表示：这个接口/控制器是公开的，不需要登录。
export const IS_PUBLIC_KEY = 'isPublic';

// @Public() 本质上不是在“执行认证逻辑”，
// 而是在给当前 controller 或 method 贴一个隐藏标签：
// isPublic = true
//
// 你可以把它理解成“贴便签”：
// - SetMetadata：负责贴便签
// - Reflector：负责读便签
//
// 例如：
// @Public()
// @Post('login')
// login() {}
//
// 这就相当于告诉系统：
// “login 这个接口是公开的，后面的 Guard 看到后就别拦它。”
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
