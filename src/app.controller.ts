import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('scrape-xgear')
  scrapeProductsFromXgear() {
    return this.appService.scrapeProductsFromXgear();
  }

  @Get('scrape-gearvn')
  scrapeProductsFromGearVn() {
    return this.appService.scrapeProductsFromGearVn();
  }

  @Get('scrape-cellphones')
  scrapeProductsFromCellphones() {
    return this.appService.scrapeProductsFromCellphones();
  }
}
