import { Controller, Get, Render } from '@nestjs/common';

@Controller()
export class AppController {
  constructor() {}

  @Get()
  @Render('index')
  getHello() {
    return { message: 'Hello world!' };
  }
}
