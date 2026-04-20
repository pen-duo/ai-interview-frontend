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
import {
  ConsumptionRecord,
  ConsumptionRecordDocument,
} from 'src/interview/schema/consumption-record.schema';
import {
  UserConsumption,
  UserConsumptionDocument,
} from './schemas/consumption-record.schema';

@Injectable()
export class UserService {
  // 注入 UserModel，后面就可以通过 this.userModel 操作 users 集合
  // User：只是你定义的“用户数据长什么样” ，UserDocument：是真正从 Mongoose 拿出来的“数据库文档对象”
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(ConsumptionRecord.name)
    private consumptionRecordModel: Model<ConsumptionRecordDocument>,
    @InjectModel(UserConsumption.name)
    private consumptionModel: Model<UserConsumptionDocument>,
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

  /**
   * 创建消费记录
   */
  async createConsumptionRecord(
    userId: string,
    type: string,
    quantity: number = 1,
    source: string = 'free',
    relatedId?: string,
  ) {
    const record = new this.consumptionModel({
      userId,
      type,
      quantity,
      source,
      relatedId,
    });

    return await record.save();
  }

  /**
   * 获取用户消费记录
   * @param userId - 用户的唯一标识
   * @param options - 可选的查询参数，包括跳过的记录数和限制的记录数
   * @returns - 返回用户的消费记录和消费统计数据
   */
  async getUserConsumptionRecords(
    userId: string, // 用户ID，用于标识和查询特定用户的消费记录
    options?: { skip: number; limit: number }, // 查询选项，包含跳过记录的数量和每次查询的记录数量
  ) {
    // 如果没有传递查询选项，则默认跳过0条记录，并限制返回20条记录
    const skip = options?.skip || 0; // 从第skip条记录开始
    const limit = options?.limit || 20; // 限制返回的记录数量，默认是20

    // 查询消费记录，按创建时间降序排列，跳过skip条记录，限制返回limit条记录
    const records = await this.consumptionRecordModel
      .find({ userId }) // 根据用户ID查询消费记录
      .sort({ createdAt: -1 }) // 按照创建时间降序排列，最新的记录排在前面
      .skip(skip) // 跳过指定数量的记录
      .limit(limit) // 限制返回的记录数量
      .lean(); // 使用lean()优化查询结果，返回普通的JavaScript对象而不是Mongoose文档

    // 统计用户各类型的消费信息，使用MongoDB的聚合框架
    const stats = await this.consumptionRecordModel.aggregate([
      { $match: { userId } }, // 过滤出属于当前用户的消费记录
      {
        $group: {
          // 按照消费类型进行分组
          _id: '$type', // 按消费类型进行分组
          count: { $sum: 1 }, // 统计每种类型的消费记录数量
          successCount: {
            $sum: { $cond: [{ $eq: ['$status', 'success'] }, 1, 0] }, // 统计状态为'success'的记录数
          },
          failedCount: {
            $sum: { $cond: [{ $eq: ['$status', 'failed'] }, 1, 0] }, // 统计状态为'failed'的记录数
          },
          totalCost: { $sum: '$estimatedCost' }, // 计算每种类型的消费总额
        },
      },
    ]);

    // 返回查询的消费记录和消费统计信息
    return {
      records, // 用户的消费记录
      stats, // 按消费类型分组后的统计信息
    };
  }
}
