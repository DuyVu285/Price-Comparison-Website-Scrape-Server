import { AnPhatPCScraperService } from '../web/anphatpc-scraper.service';
import { CellphonesScraperService } from './../web/cellphones-scraper.service';
import { GearvnScraperService } from './../web/gearvn-scraper.service';
import { XgearScraperService } from './../web/xgear-scraper.service';
import { Injectable } from '@nestjs/common';

@Injectable()
export class ScraperService {
  constructor(
    private readonly cellphonesScraperService: CellphonesScraperService,
    private readonly gearvnScraperService: GearvnScraperService,
    private readonly xgearScraperService: XgearScraperService,
    private readonly anphatpcScraperService: AnPhatPCScraperService,
  ) {}

  async scrapeCellPhonesSite() {
    await this.cellphonesScraperService.scrapeWebsite();
  }

  async scrapeGearvnSite() {
    await this.gearvnScraperService.scrapeWebsite();
  }

  async scrapeXgearSite() {
    await this.xgearScraperService.scrapeWebsite();
  }

  async scrapeAnPhatPCSite() {
    await this.anphatpcScraperService.scrapeWebsite();
  }

  async scrapeAllSites() {
    const results = await Promise.all([
      this.cellphonesScraperService.scrapeWebsite(),
      this.gearvnScraperService.scrapeWebsite(),
      this.xgearScraperService.scrapeWebsite(),
      this.anphatpcScraperService.scrapeWebsite(),
    ]);
    return results;
  }
}
