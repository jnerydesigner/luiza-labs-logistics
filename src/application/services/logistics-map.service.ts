import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { Readable } from 'stream';
import * as readline from 'readline';

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
  user_id: string;
  name: string;
  order_id: string;
  date: string;
  product_id: string;
  value: number;
}

@Injectable()
export class LogisticsMapService {
  private logger: Logger;
  constructor() {
    this.logger = new Logger(LogisticsMapService.name);
  }
  async getLogisticsMap(file: Express.Multer.File) {
    const userMap = new Map<string, ILogisticsMapResponse>();
    const fileStream = new Readable();
    fileStream.push(file.buffer);
    fileStream.push(null);

    const rl = readline.createInterface({
      input: fileStream,
      crlfDelay: Infinity,
    });

    for await (const line of rl) {
      const logisticsMap = this.processLine(line);
      this.updateUserMap(userMap, logisticsMap);
    }

    return Array.from(userMap.values());
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
      user_id: userId,
      name: userName,
      order_id: orderId,
      date,
      product_id: productId,
      value,
    };
  }

  // Monta toda a estrutura de dados
  updateUserMap(
    userMap: Map<string, ILogisticsMapResponse>,
    entry: ILogisticsMap,
  ) {
    if (!userMap.has(entry.user_id)) {
      userMap.set(entry.user_id, {
        user_id: Number(entry.user_id),
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
        order_id: Number(entry.order_id),
        total: Number(Number('0').toFixed(2)),
        date: this.formatDate(entry.date),
        products: [],
      };
      user.orders.push(order);
    }

    order.products.push({
      product_id: Number(entry.product_id),
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
}
