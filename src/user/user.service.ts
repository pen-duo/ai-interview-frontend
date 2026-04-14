import { ConflictException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { RegisterUserDto } from './dto/register-user.dto';
import { User, UserDocument } from './schemas/user.schema';

@Injectable()
export class UserService {
  // 注入 UserModel，后面就可以通过 this.userModel 操作 users 集合
  // User：只是你定义的“用户数据长什么样” ，UserDocument：是真正从 Mongoose 拿出来的“数据库文档对象”
  constructor(@InjectModel(User.name) private userModel: Model<UserDocument>) {}

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
}
