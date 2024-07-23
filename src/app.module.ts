import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { MongooseModule } from '@nestjs/mongoose';
import { ProductsModule } from './products/products.module';
import { ScraperModule } from './scraper/scraper/scraper.module';
import { ImagesModule } from './images/images.module';

@Module({
  imports: [
    MongooseModule.forRoot('mongodb://127.0.0.1:27017/PriceComparisonWebsite'),
    ProductsModule,
    ScraperModule,
    ImagesModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
