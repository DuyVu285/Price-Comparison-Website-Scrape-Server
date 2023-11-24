import { ProductsDatabasesIntergrateService } from './products-databases-intergrate/products-databases-intergrate.service';
import { GearvnScraperService } from './scraper/gearvn-scraper/gearvn-scraper.service';
import { XgearScraperService } from './scraper/xgear-scraper/xgear-scraper.service';
import { FptshopScraperService } from './scraper/fptshop-scraper/fptshop-scraper.service';
import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  constructor(private readonly XgearScraperService: XgearScraperService, private readonly GearvnScraperService: GearvnScraperService,
    private readonly FptshopScraperService: FptshopScraperService,
    private readonly ProductsDatabasesIntergrateService: ProductsDatabasesIntergrateService) { }
  getHello(): string {
    return 'Hello World!';
  }

  scrapeProductsFromXgear() {
    return this.XgearScraperService.scrapeWebsite('https://xgear.net');
  }

  scrapeProductsFromGearvn() {
    return this.GearvnScraperService.scrapeWebsite('https://gearvn.com');
  }

  scrapeProductsFromFptshop() {
    return this.FptshopScraperService.scrapeWebsite('https://fptshop.com.vn')
  }
}
