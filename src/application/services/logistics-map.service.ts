import { Injectable, Logger } from '@nestjs/common';
import { Readable } from 'stream';
import * as readline from 'readline';
import * as fs from 'fs';
import * as path from 'path';

export interface ILogisticsMapResponse {
  user_id: number;
  name: string;
  orders: IOrder[];
}

export interface IOrder {
  order_id: number;
  total: string; // Alterado para string
  date: string;
  products: IProduct[];
}

export interface IProduct {
  product_id: number;
  value: string; // Alterado para string
}

export interface ILogisticsMap {
  user_id: number;
  name: string;
  order_id: number;
  date: string;
  product_id: number;
  value: string; // Alterado para string
}

export interface ILogisticsMapError {
  line: number;
  message: string;
}

export interface ILogisticsError {
  errors: ILogisticsMapError[];
}

@Injectable()
export class LogisticsMapService {
  private logger: Logger;
  constructor() {
    this.logger = new Logger(LogisticsMapService.name);
  }
  async getLogisticsMap(file: Express.Multer.File, nameFileExport: string) {
    const userMap = new Map<number, ILogisticsMapResponse>();
    const fileStream = new Readable();
    fileStream.push(file.buffer);
    fileStream.push(null);

    const rl = readline.createInterface({
      input: fileStream,
      crlfDelay: Infinity,
    });

    let linesCount = 0;
    const linesErrors = [];
    const logisticsErrors: ILogisticsError = { errors: [] };

    for await (const line of rl) {
      linesCount++;

      const logisticsMap = this.processLine(line);

      if (isNaN(parseFloat(logisticsMap.value)) || logisticsMap.user_id === 0) {
        linesErrors.push(linesCount);

        logisticsErrors.errors.push({
          line: linesCount,
          message: `Error in line ${linesCount}.`,
        });
      } else {
        this.updateUserMap(userMap, logisticsMap);
      }
    }

    if (linesErrors.length > 0) {
      this.logger.error(`Errors in lines: ${linesErrors.join(', ')}`);
      await this.saveJsonToFile('errors.json', logisticsErrors, true);
    }

    const response = Array.from(userMap.values());

    await this.saveJsonToFile(nameFileExport, response, false);

    return response;
  }

  // Processador da linha do arquivo, transforma em um Json simples
  processLine(line: string): ILogisticsMap {
    const userId = line.slice(0, 10).trim();
    let rest = line.slice(10).trim();
    const date = rest.slice(-8).trim();
    rest = rest.slice(0, -8).trim();
    const userName = this.extractUntilFirstZero(rest);
    rest = rest.slice(userName.length).trim();
    const orderId = rest.slice(0, 10).trim();
    rest = rest.slice(orderId.length).trim();
    const productId = rest.slice(0, 10).trim();
    const value = rest.slice(10).trim(); // Alterado para string

    return {
      user_id: Number(userId),
      name: userName,
      order_id: Number(orderId),
      date,
      product_id: Number(productId),
      value,
    };
  }

  // Monta toda a estrutura de dados
  updateUserMap(
    userMap: Map<number, ILogisticsMapResponse>,
    entry: ILogisticsMap,
  ) {
    if (!userMap.has(entry.user_id)) {
      userMap.set(entry.user_id, {
        user_id: entry.user_id,
        name: entry.name,
        orders: [],
      });
    }

    const user = userMap.get(entry.user_id);

    let order = user.orders.find(
      (order) => order.order_id === Number(entry.order_id),
    );

    if (!order) {
      order = {
        order_id: entry.order_id,
        total: '0', // Alterado para string
        date: this.formatDate(entry.date),
        products: [],
      };
      user.orders.push(order);
    }

    order.products.push({
      product_id: entry.product_id,
      value: entry.value,
    });

    order.total = String(Number(order.total) + Number(entry.value)); // Alterado para string
  }

  extractUntilFirstZero(str: string) {
    const zeroIndex = str.indexOf('0');
    return zeroIndex !== -1 ? str.slice(0, zeroIndex) : str;
  }

  formatDate(dateString: string) {
    return `${dateString.slice(0, 4)}-${dateString.slice(4, 6)}-${dateString.slice(6, 8)}`;
  }

  async saveJsonToFile(filename: string, data: any, error: boolean) {
    const jsonString = JSON.stringify(data, null, 2);
    const buffer = Buffer.from(jsonString, 'utf8');

    this.logger.log(`Arquivo ${filename} salvo com sucesso.`);
    const directory = error ? 'errors' : 'results';
    const filePath = path.join(process.cwd(), 'logs', directory, filename);

    await fs.promises.writeFile(filePath, buffer.toString('utf8'), 'utf8');
  }
}
