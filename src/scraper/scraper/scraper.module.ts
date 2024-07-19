import { Module } from '@nestjs/common';
import { ScraperService } from './scraper.service';
import { ScraperController } from './scraper.controller';
import { CellphonesScraperService } from '../web/cellphones-scraper.service';
import { GearvnScraperService } from '../web/gearvn-scraper.service';
import { XgearScraperService } from '../web/xgear-scraper.service';
import { ProductsModule } from 'src/products/products.module';
import { AnPhatPCScraperService } from '../web/anphatpc-scraper.service';

@Module({
  imports: [ProductsModule],
  controllers: [ScraperController],
  providers: [
    ScraperService,
    CellphonesScraperService,
    GearvnScraperService,
    XgearScraperService,
    AnPhatPCScraperService
  ],
})
export class ScraperModule {}
