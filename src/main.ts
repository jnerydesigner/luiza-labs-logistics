import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './infra/modules/app.module';
import { join } from 'path';
import { Logger } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  const logger = new Logger();

  app.useStaticAssets(join(`${process.cwd()}`, 'public'));
  app.setBaseViewsDir(join(`${process.cwd()}`, 'views'));
  app.setViewEngine('hbs');

  const PORT = 3333;
  await app.listen(PORT, async () => {
    logger.log(`Server is running on ${await app.getUrl()}`);
  });
}
bootstrap();
