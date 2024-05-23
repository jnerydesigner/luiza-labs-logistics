import {
  ILogisticsMapResponse,
  LogisticsMapService,
} from '@application/services/logistics-map.service';
import { HttpException, HttpStatus, Logger } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { LogisticsMapController } from '@presenters/controllers/logistics-map.controller';

function MockFile(): Express.Multer.File {
  const buffer = Buffer.from(
    '0000000001                             John Doe00000000010000000001     100.0020240524\n',
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
  let logisticsMapService: LogisticsMapService;
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

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [LogisticsMapController],
      providers: [LogisticsMapService, Logger],
    }).compile();

    logisticsMapController = app.get<LogisticsMapController>(
      LogisticsMapController,
    );

    logisticsMapService = app.get<LogisticsMapService>(LogisticsMapService);

    logger = app.get<Logger>(Logger);

    jest.spyOn(logger, 'error').mockImplementation(() => {});
  });

  describe('root', () => {
    it('should to be defined', () => {
      expect(logisticsMapController).toBeDefined();
    });

    it('should return a list of logistics map', async () => {
      const mockFile = MockFile();

      const result = await logisticsMapController.uploadFile(mockFile);

      const expected = [
        {
          user_id: 1,
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

      expect(result).toEqual(expected);

      jest.resetAllMocks();
    });

    it('should log an error if something goes wrong', async () => {
      const mockFile: Express.Multer.File = {
        buffer: Buffer.from('invalid buffer'),
        fieldname: 'file',
        originalname: 'testfile.txt',
        encoding: '7bit',
        mimetype: 'text/plain',
        size: 1024,
        stream: null,
        destination: '',
        filename: '',
        path: '',
      };

      jest.spyOn(logisticsMapService, 'processLine').mockImplementation(() => {
        throw new HttpException('Invalid line', HttpStatus.BAD_REQUEST);
      });

      expect(logisticsMapService.getLogisticsMap(mockFile)).rejects.toThrow(
        new HttpException('Invalid line', HttpStatus.BAD_REQUEST),
      );

      jest.clearAllMocks();
    });
  });

  it('should throw an error if userId is not a number', () => {
    const line = 'notANumber restOfTheLine';

    expect(() => logisticsMapService.processLine(line)).toThrow(
      new HttpException('Invalid line', HttpStatus.BAD_REQUEST),
    );
  });

  it("Shold return a date in the format 'YYYY-MM-DD'", () => {
    const date = '20240524';
    const result = logisticsMapService.formatDate(date);

    expect(result).toBe('2024-05-24');
    jest.clearAllMocks();
  });

  it('should find the correct order', () => {
    const user = {
      user_id: 1,
      name: 'Test User',
      orders: [
        {
          order_id: 1,
          total: 100,
          date: '2021-01-01',
          products: [],
        },
        {
          order_id: 2,
          total: 200,
          date: '2021-02-01',
          products: [],
        },
      ],
    };

    const entry = {
      user_id: '1',
      name: 'Test User',
      order_id: '1',
      date: '2021-01-01',
      product_id: '1',
      value: 50,
    };

    const userMap = new Map<string, ILogisticsMapResponse>();
    userMap.set(entry.user_id, user);

    logisticsMapService.updateUserMap(userMap, entry);

    const updatedUser = userMap.get(entry.user_id);
    const order = updatedUser.orders.find(
      (order) => order.order_id === Number(entry.order_id),
    );

    expect(order).toBeDefined();
    expect(order.order_id).toEqual(Number(entry.order_id));
  });
});
