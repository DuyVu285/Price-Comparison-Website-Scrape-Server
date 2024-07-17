import { Module } from '@nestjs/common';
import { SearchController } from './search.controller';
import { SearchService } from './search.service';
import { XgearSearchService } from '../web/xgear-search.service';
import { ProductsModule } from 'src/products/products.module';
import { gearVnSearchService } from '../web/gearvn-search.service';
import { cellphoneSSearchService } from '../web/cellphones-search.service';

@Module({
  imports: [ProductsModule],
  controllers: [SearchController],
  providers: [SearchService, XgearSearchService, gearVnSearchService, cellphoneSSearchService],
})
export class SearchModule {}
