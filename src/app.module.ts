import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { MongooseModule } from '@nestjs/mongoose';
import { XgearScraperService } from './scraper/xgear-scraper/xgear-scraper.service';
import { GearvnScraperService } from './scraper/gearvn-scraper/gearvn-scraper.service';
import { ProductsModule } from './products/products.module';
import { FptshopScraperService } from './scraper/fptshop-scraper/fptshop-scraper.service';

@Module({
  imports: [MongooseModule.forRoot('mongodb://127.0.0.1:27017/PriceComparisonWebsite'), ProductsModule],
  controllers: [AppController],
  providers: [AppService, XgearScraperService, GearvnScraperService, FptshopScraperService],
})
export class AppModule { }