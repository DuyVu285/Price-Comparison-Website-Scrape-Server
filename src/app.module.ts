import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { MongooseModule } from '@nestjs/mongoose';
import { XgearScraperService } from './scraper/xgear-scraper.service';
import { ProductsModule } from './products/products.module';
import { SearchModule } from './scrape-search/search/search.module';
import { GearvnScraperService } from './scraper/gearvn-scraper.service';
import { CellphonesScraperService } from './scraper/cellphones-scraper.service';

@Module({
  imports: [
    MongooseModule.forRoot('mongodb://127.0.0.1:27017/PriceComparisonWebsite'),
    ProductsModule,
    SearchModule,
  ],
  controllers: [AppController],
  providers: [AppService, XgearScraperService, GearvnScraperService, CellphonesScraperService],
})
export class AppModule {}
