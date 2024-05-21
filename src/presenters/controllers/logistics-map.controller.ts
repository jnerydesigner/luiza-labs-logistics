import { LogisticsMapService } from '@application/services/logistics-map.service';
import {
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';

@Controller('logistics-map')
export class LogisticsMapController {
  constructor(private readonly logisticsMapService: LogisticsMapService) {}

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  uploadFile(@UploadedFile() file: Express.Multer.File) {
    return this.logisticsMapService.getLogisticsMap(file);
  }
}
