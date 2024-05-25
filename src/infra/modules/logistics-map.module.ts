import { LogisticsMapService } from '@application/services/logistics-map.service';
import { Module } from '@nestjs/common';
import { LogisticsMapController } from '@presenters/controllers/logistics-map.controller';

@Module({
  controllers: [LogisticsMapController],
  providers: [LogisticsMapService],
  exports: [LogisticsMapService],
})
export class LogisticsMapModule {}
