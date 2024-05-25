import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { Readable } from 'stream';
import * as readline from 'readline';
import * as fs from 'fs';
import { promisify } from 'util';

const writeFileAsync = promisify(fs.writeFile);

export interface ILogisticsMapResponse {
  user_id: number;
  name: string;
  orders: IOrder[];
}

export interface IOrder {
  order_id: number;
  total: number;
  date: string;
  products: IProduct[];
}

export interface IProduct {
  product_id: number;
  value: number;
}

export interface ILogisticsMap {
  user_id: number;
  name: string;
  order_id: number;
  date: string;
  product_id: number;
  value: number;
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

    for await (const line of rl) {
      linesCount++;
      const logisticsMap = this.processLine(line);

      console.log(logisticsMap);
      this.updateUserMap(userMap, logisticsMap);
    }

    console.log(linesCount);

    const response = Array.from(userMap.values());

    await this.saveJsonToFile(nameFileExport, response);

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
    const value = parseFloat(rest.slice(10).trim());

    if (isNaN(Number(userId))) {
      this.logger.error(`Invalid line`);
      throw new HttpException('Invalid line', HttpStatus.BAD_REQUEST);
    }

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
        total: Number(Number('0').toFixed(2)),
        date: this.formatDate(entry.date),
        products: [],
      };
      user.orders.push(order);
    }

    order.products.push({
      product_id: entry.product_id,
      value: entry.value,
    });

    order.total = Number((order.total + entry.value).toFixed(2));
  }

  // Busca a primeira ocorrencia do numero 0, para encontrar o fina dos caracters de userName
  extractUntilFirstZero(str: string) {
    const zeroIndex = str.indexOf('0');
    return zeroIndex !== -1 ? str.slice(0, zeroIndex) : str;
  }

  // Transforma a data
  formatDate(dateString: string) {
    return `${dateString.slice(0, 4)}-${dateString.slice(4, 6)}-${dateString.slice(6, 8)}`;
  }

  async saveJsonToFile(filename: string, data: any) {
    const jsonString = JSON.stringify(data, null, 2);
    const buffer = Buffer.from(jsonString, 'utf8');

    console.log(`Arquivo ${filename} salvo com sucesso.`);
    await writeFileAsync(`${filename}`, buffer.toString('utf8'), 'utf8');
  }
}
