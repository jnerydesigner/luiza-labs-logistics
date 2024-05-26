import {
  ILogisticsMapResponse,
  LogisticsMapService,
} from '@application/services/logistics-map.service';
import { Logger } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as fs from 'fs';
import * as path from 'path';

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

describe('LogisticsMapService', () => {
  let logisticsMapService: LogisticsMapService;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      providers: [
        LogisticsMapService,
        {
          provide: Logger,
          useValue: {
            log: jest.fn(),
            error: jest.fn(),
          },
        },
      ],
    }).compile();
    logisticsMapService = app.get<LogisticsMapService>(LogisticsMapService);
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('should be defined', () => {
    expect(logisticsMapService).toBeDefined();
  });

  it('should save file to the errors directory if error is true', async () => {
    const data = {
      errors: [
        {
          line: 1,
          message: 'Error Test True in line 1.',
        },
      ],
    };
    const filename = 'errors-test-true.json';
    const error = true;

    jest.spyOn(fs.promises, 'writeFile').mockResolvedValue();

    await logisticsMapService.saveJsonToFile(filename, data, error);

    const expectedPath = path.join(process.cwd(), 'logs', 'errors', filename);

    expect(fs.promises.writeFile).toHaveBeenCalledWith(
      expectedPath,
      JSON.stringify(data, null, 2),
      'utf8',
    );

    jest.clearAllMocks();
  });

  it('should save file to the results directory if error is false', async () => {
    const data = { errors: [] };
    const filename = 'errors-test-false.json';
    const error = false;

    jest.spyOn(fs.promises, 'writeFile').mockResolvedValue();

    await logisticsMapService.saveJsonToFile(filename, data, error);

    const expectedPath = path.join(process.cwd(), 'logs', 'results', filename);

    expect(fs.promises.writeFile).toHaveBeenCalledWith(
      expectedPath,
      JSON.stringify(data, null, 2),
      'utf8',
    );

    jest.clearAllMocks();
  });

  it('should return a logistics map', async () => {
    const file = MockFile();
    const nameFileExport =
      'logistics-map-6a6b37c7-6f88-47e9-86ac-b52816097284.json';

    const result = await logisticsMapService.getLogisticsMap(
      file,
      nameFileExport,
    );

    expect(result).toBeDefined();
  });

  it('should return a logistics map with errors', async () => {
    function MockFile(): Express.Multer.File {
      const buffer = Buffer.from('\n');

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

    const logisticsMap = await logisticsMapService.getLogisticsMap(
      MockFile(),
      'logistics-map-6a6b37c7-6f88-47e9-86ac-b52816097284.json',
    );

    expect(logisticsMap).toEqual([]);
  });

  it('should logisticsErro saved in file json', async () => {
    const logisticsError = {
      errors: [
        {
          line: 1,
          message: 'Error in line 1.',
        },
      ],
    };

    const result = await logisticsMapService.saveJsonToFile(
      'errors-test.json',
      logisticsError,
      true,
    );

    expect(result).toBeUndefined();
  });

  it("Should return a date in the format 'YYYY-MM-DD'", async () => {
    const date = '20240524';
    const result = logisticsMapService.formatDate(date);

    expect(result).toBe('2024-05-24');
  });

  it('should find the correct order', () => {
    const user = {
      user_id: 1,
      name: 'Test User',
      orders: [
        {
          order_id: 1,
          total: '100',
          date: '2021-01-01',
          products: [],
        },
        {
          order_id: 2,
          total: '200',
          date: '2021-02-01',
          products: [],
        },
      ],
    };

    const entry = {
      user_id: 1,
      name: 'Test User',
      order_id: 1,
      date: '2021-01-01',
      product_id: 1,
      value: '50',
    };

    const userMap = new Map<number, ILogisticsMapResponse>();
    userMap.set(entry.user_id, user);

    logisticsMapService.updateUserMap(userMap, entry);

    const updatedUser = userMap.get(entry.user_id);
    const order = updatedUser.orders.find(
      (order) => order.order_id === Number(entry.order_id),
    );

    expect(order).toBeDefined();
    expect(order.order_id).toEqual(Number(entry.order_id));
  });

  it('should create a new user entry if user_id does not exist in userMap', () => {
    const userMap = new Map<number, ILogisticsMapResponse>();

    const entry = {
      user_id: 1,
      name: 'Test User',
      order_id: 1,
      date: '2021-01-01',
      product_id: 1,
      value: '50',
    };

    logisticsMapService.updateUserMap(userMap, entry);

    const updatedUser = userMap.get(entry.user_id);

    expect(updatedUser).toBeDefined();
    expect(updatedUser.user_id).toEqual(entry.user_id);
    expect(updatedUser.name).toEqual(entry.name);
    expect(updatedUser.orders).toHaveLength(1);
    expect(updatedUser.orders[0].order_id).toEqual(entry.order_id);
  });
});
