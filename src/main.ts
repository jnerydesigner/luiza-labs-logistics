import { NestFactory } from '@nestjs/core';
import { AppModule } from './infra/modules/app.module';
import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api');

  const logger = new Logger();
  const config = new ConfigService();
  const PORT = Number(config.get('HOST_PORT'));
  await app.listen(PORT, () => {
    logger.log(`Server is running on http://localhost:${PORT}`);
  });
}
bootstrap();
