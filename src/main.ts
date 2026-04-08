import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService); // 从 Nest 配置中心读取配置

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // 从环境变量里读取允许跨域的来源
  app.enableCors({
    origin: configService.get<string>('app.corsOrigin', '*'),
  });

  const port = configService.get<number>('app.port', 3000); // 从配置里读取端口
  await app.listen(port);
}

void bootstrap();
