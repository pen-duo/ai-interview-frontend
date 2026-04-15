import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
// ConfigModule: 负责在 Nest 启动时加载 .env 和配置文件
import { ConfigModule } from '@nestjs/config';
// ConfigService: 负责在代码里读取已经加载好的配置值
import { ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { JwtStrategy } from './auth/jwt.strategy';
import appConfig from './config/app.config';
import { validateEnv } from './config/env-validation';
import { UserModule } from './user/user.module';
import { InterviewModule } from './interview/interview.module';

type JwtExpiresIn =
  | number
  | `${number}${'ms' | 's' | 'm' | 'h' | 'd' | 'w' | 'y'}`;

@Module({
  imports: [
    // forRoot: 适合直接初始化模块，这里用于启动时一次性加载环境变量配置
    ConfigModule.forRoot({
      isGlobal: true, // 全局生效，其他模块就不用重复导入 ConfigModule
      cache: true, // 缓存配置读取结果，避免每次都重新解析
      envFilePath: `.env.${process.env.NODE_ENV || 'development'}`, // 按环境读取对应的 .env 文件
      load: [appConfig], // 把零散环境变量整理成统一配置对象
      validate: validateEnv, // 项目启动前先校验环境变量是否合法
    }),
    // forRootAsync: 适合需要先读取配置、再动态生成初始化参数的场景
    MongooseModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        uri: configService.get<string>('database.uri'), // 从统一配置里读取 MongoDB 地址
      }),
    }),
    // registerAsync: 动态读取 JWT 配置，并注册成全局模块
    // JwtModule 负责生成 token
    // JwtStrategy 负责校验 token
    // JwtAuthGuard 负责把 JwtStrategy 应用到具体接口上
    JwtModule.registerAsync({
      global: true,
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.getOrThrow<string>('jwt.secret'),
        signOptions: {
          expiresIn: configService.getOrThrow<string>(
            'jwt.expiresIn',
          ) as JwtExpiresIn,
        },
      }),
    }),
    // PassportModule 本身没有 global 选项；在根模块注册后可作为全局默认认证配置使用
    PassportModule,
    UserModule,
    InterviewModule,
  ],
  controllers: [AppController],
  providers: [AppService, JwtStrategy],
})
export class AppModule {}
