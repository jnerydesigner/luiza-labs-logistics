import { LogisticsMapController } from '@presenters/controllers/logistics-map.controller';
import { Logger } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import {
  ILogisticsMapResponse,
  LogisticsMapService,
} from '@application/services/logistics-map.service';

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
  let logisticsMapService: LogisticsMapService;

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
    logisticsMapService = app.get<LogisticsMapService>(LogisticsMapService);

    jest.spyOn(logger, 'error').mockImplementation(() => {});
  });

  it('should to be defined', () => {
    expect(logisticsMapController).toBeDefined();
  });

  it('should return a list of logistics map', async () => {
    const mockFile = MockFile();

    const expectedResponse: ILogisticsMapResponse[] = [
      {
        user_id: 2,
        name: 'John Doe',
        orders: [
          {
            order_id: 1,
            total: '100.0',
            date: '2024-05-24',
            products: [{ product_id: 1, value: '100.0' }],
          },
        ],
      },
    ];

    jest
      .spyOn(logisticsMapService, 'getLogisticsMap')
      .mockReturnValueOnce(Promise.resolve(expectedResponse));

    const result = await logisticsMapController.uploadFile(mockFile);

    expect(result).toEqual(expectedResponse);

    jest.resetAllMocks();
  });
});
