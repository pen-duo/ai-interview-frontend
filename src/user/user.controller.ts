import {
  Controller,
  Post,
  Body,
  UseGuards,
  Get,
  Req,
  Put,
} from '@nestjs/common';
import type { Request } from 'express';
import { ApiBearerAuth } from '@nestjs/swagger';
import { UserService } from './user.service';
import { ChangePasswordDto } from './dto/change-password.dto';
import { LoginUserDto } from './dto/login-user.dto';
import { RegisterUserDto } from './dto/register-user.dto';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { UpdateUserDto } from './dto/update-user.dto';
import { Public } from 'src/auth/public.decorator';

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
  @Public()
  register(@Body() registerUserDto: RegisterUserDto) {
    return this.userService.register(registerUserDto);
  }

  @Post('login')
  @Public()
  login(@Body() loginUserDto: LoginUserDto) {
    return this.userService.login(loginUserDto);
  }

  @Get('info')
  @ApiBearerAuth()
  getUserInfo(@Req() req: AuthenticatedRequest) {
    const { userId } = req.user;
    return this.userService.getUserInfo(userId);
  }

  @Put('info')
  @ApiBearerAuth()
  updateUserInfo(
    @Req() req: AuthenticatedRequest,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    const { userId } = req.user;
    return this.userService.updateUserInfo(userId, updateUserDto);
  }

  @Put('password')
  @ApiBearerAuth()
  changePassword(
    @Req() req: AuthenticatedRequest,
    @Body() changePasswordDto: ChangePasswordDto,
  ) {
    const { userId } = req.user;
    return this.userService.changePassword(userId, changePasswordDto);
  }
}
