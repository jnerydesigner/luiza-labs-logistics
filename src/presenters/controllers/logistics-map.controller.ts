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
    const uuid = '6a6b37c7-6f88-47e9-86ac-b52816097284';
    const nameFileExport = `logistics-map-${uuid}.json`;

    console.log(nameFileExport);

    return this.logisticsMapService.getLogisticsMap(file, nameFileExport);
  }
}
