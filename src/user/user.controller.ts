import { Controller, Post, Body, UseGuards, Get, Req } from '@nestjs/common';
import type { Request } from 'express';
import { ApiBearerAuth } from '@nestjs/swagger';
import { UserService } from './user.service';
import { LoginUserDto } from './dto/login-user.dto';
import { RegisterUserDto } from './dto/register-user.dto';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';

interface AuthenticatedRequest extends Request {
  user: {
    userId: string;
    email?: string;
    username?: string;
  };
}

@Controller('user')
@UseGuards(JwtAuthGuard)
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post('register')
  register(@Body() registerUserDto: RegisterUserDto) {
    return this.userService.register(registerUserDto);
  }

  @Post('login')
  login(@Body() loginUserDto: LoginUserDto) {
    return this.userService.login(loginUserDto);
  }

  @Get('info')
  @ApiBearerAuth()
  getUserInfo(@Req() req: AuthenticatedRequest) {
    const { userId } = req.user;
    return this.userService.getUserInfo(userId);
  }
}
