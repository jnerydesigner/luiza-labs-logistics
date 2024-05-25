import { LogisticsMapService } from '@application/services/logistics-map.service';
import { Logger } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { LogisticsMapController } from '@presenters/controllers/logistics-map.controller';

function MockFile(): Express.Multer.File {
  const buffer = Buffer.from(
    '0000000002                             John Doe00000000010000000001     100.0020240524\n',
  );

  return {
    fieldname: 'file',
    originalname: 'mock.txt',
    encoding: '7bit',
    mimetype: 'text/plain',
    size: buffer.length,
    buffer: buffer,
    destination: '',
    filename: '',
    path: '',
    stream: null,
  };
}

describe('LogisticsMapController', () => {
  let logisticsMapController: LogisticsMapController;
  let logger: Logger;
  MockFile.prototype.create = function (name, size, mimeType) {
    name = name || 'mock.txt';
    size = size || 1024;
    mimeType = mimeType || 'plain/txt';

    function range(count) {
      let output = '';
      for (let i = 0; i < count; i++) {
        output += 'a';
      }
      return output;
    }

    const blob = new Blob([range(size)], { type: mimeType });

    return blob;
  };

  afterEach(() => {
    jest.resetAllMocks();
  });

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [LogisticsMapController],
      providers: [LogisticsMapService, Logger],
    }).compile();

    logisticsMapController = app.get<LogisticsMapController>(
      LogisticsMapController,
    );

    logger = app.get<Logger>(Logger);

    jest.spyOn(logger, 'error').mockImplementation(() => {});
  });

  it('should to be defined', () => {
    expect(logisticsMapController).toBeDefined();
  });

  it('should return a list of logistics map', async () => {
    const mockFile = MockFile();

    const expectedResponse = [
      {
        user_id: 2,
        name: 'John Doe',
        orders: [
          {
            order_id: 1,
            total: 100.0,
            date: '2024-05-24',
            products: [{ product_id: 1, value: 100.0 }],
          },
        ],
      },
    ];

    const result = await logisticsMapController.uploadFile(mockFile);

    expect(result).toEqual(expectedResponse);

    jest.resetAllMocks();
  });
});
