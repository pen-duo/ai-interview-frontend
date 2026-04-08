import { resolve } from 'node:path';
import { config } from 'dotenv';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

const nodeEnv = process.env.NODE_ENV || 'development';
const envFilePath = resolve(process.cwd(), `.env.${nodeEnv}`);

config({ path: envFilePath });

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // 开启跨域
  app.enableCors();

  const port = Number(process.env.PORT) || 3000;
  await app.listen(port);
}

void bootstrap();
