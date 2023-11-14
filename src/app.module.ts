import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { MongooseModule } from '@nestjs/mongoose';
import { ProductsService } from './products/products.service';
import { XgearScraperService } from './scraper/xgear-scraper/xgear-scraper.service';
import { GearvnScraperService } from './scraper/gearvn-scraper/gearvn-scraper.service';
import { ProductsModule } from './products/products.module';

@Module({
  imports: [MongooseModule.forRoot('mongodb://127.0.0.1:27017/PriceComparisonWebsite'), ProductsModule],
  controllers: [AppController],
  providers: [AppService, XgearScraperService, GearvnScraperService],
})
export class AppModule { }