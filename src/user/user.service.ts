import {
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
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
}
