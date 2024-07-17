import { CellphonesScraperService } from './scraper/cellphones-scraper.service';
import { GearvnScraperService } from './scraper/gearvn-scraper.service';
import { XgearScraperService } from './scraper/xgear-scraper.service';
import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  constructor(
    private readonly XgearScraperService: XgearScraperService,
    private readonly GearvnScraperService: GearvnScraperService,
    private readonly CellphonesScraperService: CellphonesScraperService,
  ) {}
  getHello(): string {
    return 'Hello World!';
  }

  scrapeProductsFromXgear() {
    return this.XgearScraperService.scrapeWebsite();
  }

  scrapeProductsFromGearVn() {
    return this.GearvnScraperService.scrapeWebsite();
  }

  scrapeProductsFromCellphones() {
    return this.CellphonesScraperService.scrapeWebsite();
  }
}
