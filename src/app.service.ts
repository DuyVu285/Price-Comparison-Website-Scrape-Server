import { XgearScraperService } from './scraper/xgear-scraper/xgear-scraper.service';
import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  constructor(private readonly XgearScraperService: XgearScraperService){}
  getHello(): string {
    return 'Hello World!';
  }

  scrapeProducts() {
    return this.XgearScraperService.scrapeWebsite('https://xgear.net');
  }
}
