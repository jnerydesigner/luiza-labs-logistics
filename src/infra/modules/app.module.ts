import { AppService } from '@application/services/app.service';
import { Module } from '@nestjs/common';
import { AppController } from '@presenters/controllers/app.controller';
import { LogisticsMapModule } from './logistics-map.module';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [ConfigModule.forRoot(), LogisticsMapModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
