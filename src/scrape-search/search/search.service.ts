import { cellphoneSSearchService } from '../web/cellphones-search.service';
import { gearVnSearchService } from './../web/gearvn-search.service';
import { Injectable } from '@nestjs/common';
import { XgearSearchService } from '../web/xgear-search.service';
import { ProductsService } from 'src/products/products.service';

@Injectable()
export class SearchService {
  constructor(
    private readonly xGearSearchSerive: XgearSearchService,
    private readonly gearVnSearchService: gearVnSearchService,
    private readonly cellphoneSSearchService: cellphoneSSearchService,
    private readonly productsService: ProductsService,
  ) {}

  async searchProduct(searchQuery: string) {
    try {
      await Promise.all([
        this.xGearSearchSerive.scrapeWebsite(searchQuery),
        this.gearVnSearchService.scrapeWebsite(searchQuery),
        this.cellphoneSSearchService.scrapeWebsite(searchQuery),
      ]);

      const results = await this.productsService.searchProducts(searchQuery);

      console.log(' Search results:', results);

      return results;
    } catch (error) {
      console.error('Error occurred:', error.message);
      return { error: 'An error occurred while searching for products.' };
    }
  }
}
