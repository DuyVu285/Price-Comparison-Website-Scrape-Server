import { Controller, Get } from '@nestjs/common';
import { ScraperService } from './scraper.service';

@Controller()
export class ScraperController {
  constructor(private readonly scraperService: ScraperService) {}

  @Get('scrape/all')
  scrapeAll() {
    return this.scraperService.scrapeAllSites();
  }

  @Get('scrape/cellphones')
  scrapeCellPhones() {
    return this.scraperService.scrapeCellPhonesSite();
  }

  @Get('scrape/gearvn')
  scrapeGearvn() {
    return this.scraperService.scrapeGearvnSite();
  }

  @Get('scrape/xgear')
  scrapeXgear() {
    return this.scraperService.scrapeXgearSite();
  }

  @Get('scrape/anphatpc')
  scrapeAnPhatPC() {
    return this.scraperService.scrapeAnPhatPCSite();
  }

  @Get('scrape/laptopaz')
  scrapeLaptopAz() {
    return this.scraperService.scrapeLaptopAzSite();
  }
}
