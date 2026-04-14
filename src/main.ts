import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

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

  // Swagger: 生成接口文档配置
  const swaggerConfig = new DocumentBuilder()
    .setTitle('AI Mianshi Dog API')
    .setDescription('AI Mianshi Dog 项目接口文档')
    .setVersion('1.0.0')
    .build();

  // Swagger: 根据上面的配置生成 OpenAPI 文档，并挂到 /api-docs
  const swaggerDocument = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api-docs', app, swaggerDocument);

  const port = configService.get<number>('app.port', 3000); // 从配置里读取端口
  await app.listen(port);
}

void bootstrap();
