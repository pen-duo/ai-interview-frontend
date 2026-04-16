import {
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ChangePasswordDto } from './dto/change-password.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { LoginUserDto } from './dto/login-user.dto';
import { RegisterUserDto } from './dto/register-user.dto';
import { User, UserDocument } from './schemas/user.schema';

@Injectable()
export class UserService {
  // 注入 UserModel，后面就可以通过 this.userModel 操作 users 集合
  // User：只是你定义的“用户数据长什么样” ，UserDocument：是真正从 Mongoose 拿出来的“数据库文档对象”
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private readonly jwtService: JwtService,
  ) {}

  async register(registerUserDto: RegisterUserDto) {
    const { username, email } = registerUserDto;
    const existingUser = await this.userModel
      .findOne({ $or: [{ username }, { email }] })
      .lean(); // lean()：把查询结果变成普通对象，更轻、更快

    // existingUser如果没找到会是null
    if (existingUser) {
      throw new ConflictException('用户名已存在');
    }

    const createdUser = await this.userModel.create(registerUserDto); //create()：等于 new Model() + save()
    const savedUser = await this.userModel
      .findById(createdUser._id)
      .select('-password')
      .lean();

    return savedUser;
  }

  async login(loginUserDto: LoginUserDto) {
    const { email, password } = loginUserDto;
    const user = await this.userModel.findOne({ email });

    if (!user) {
      throw new UnauthorizedException('用户不存在或密码错误');
    }

    const isPasswordValid = await user.comparePassword(password);

    if (!isPasswordValid) {
      throw new UnauthorizedException('用户不存在或密码错误');
    }

    const accessToken = await this.jwtService.signAsync({
      sub: String(user._id),
      email: user.email,
      username: user.username,
    });

    const userInfo = await this.userModel
      .findById(user._id)
      .select('-password')
      .lean();

    return {
      accessToken,
      userInfo,
    };
  }

  async getUserInfo(userId: string) {
    const user = await this.userModel
      .findById(userId)
      .select('-password')
      .lean();
    if (!user) {
      throw new NotFoundException('用户不存在');
    }
    return user;
  }

  async updateUserInfo(userId: string, updateUserDto: UpdateUserDto) {
    if (updateUserDto.email) {
      const existingUser = await this.userModel
        .findOne({
          email: updateUserDto.email,
          _id: { $ne: userId }, // 排除当前用户
        })
        .lean();

      if (existingUser) {
        throw new ConflictException('邮箱已被使用');
      }
    }

    const user = await this.userModel
      .findByIdAndUpdate(userId, updateUserDto, {
        new: true, // 返回更新后的文档；否则默认拿到的是更新前的数据
        runValidators: true, // 更新时也执行 Schema 校验，避免写入不合法的数据
      })
      .select('-password')
      .lean();

    if (!user) {
      throw new NotFoundException('用户不存在');
    }

    return user;
  }

  async changePassword(userId: string, changePasswordDto: ChangePasswordDto) {
    const { oldPassword, newPassword } = changePasswordDto;
    const user = await this.userModel.findById(userId);

    if (!user) {
      throw new NotFoundException('用户不存在');
    }

    const isOldPasswordValid = await user.comparePassword(oldPassword);
    if (!isOldPasswordValid) {
      throw new UnauthorizedException('旧密码错误');
    }

    user.password = newPassword;
    await user.save(); // 这里会触发 schema 里的 pre('save')，自动加密新密码

    return {
      message: '密码修改成功',
    };
  }
}
