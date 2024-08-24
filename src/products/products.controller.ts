import { ProductsService } from 'src/products/products.service';
import { Body, Controller, Get, Param, Post} from '@nestjs/common';

@Controller('')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Post('api/products/filterAndStoreProduct')
  async filterAndStoreProduct(@Body() data: any): Promise<void> {
    try {
      await this.productsService.filterAndStoreProduct(data);
    } catch (error) {
      console.error(`Error in filterAndStoreProduct: ${error.message}`);
      throw new Error(`Unable to filter and store product: ${error.message}`);
    }
  }

  @Post('api/products/filterAndStoreMultipleProducts')
  async filterAndStoreMultipleProducts(
    @Body() dataArray: any[],
  ): Promise<void> {
    try {
      await this.productsService.filterAndStoreMultipleProducts(dataArray);
    } catch (error) {
      console.error(
        `Error in filterAndStoreMultipleProducts: ${error.message}`,
      );
      throw new Error(
        `Unable to filter and store multiple products: ${error.message}`,
      );
    }
  }

  @Get('api/products/search/:query')
  async searchProducts(@Param('query') query: string): Promise<any[]> {
    console.log('Query:', query);
    try {
      const products = await this.productsService.searchProducts(query);
      return products;
    } catch (error) {
      console.error(`Error in searchProducts: ${error.message}`);
      throw new Error(`Unable to search products: ${error.message}`);
    }
  }
}
