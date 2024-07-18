import { ProductsService } from 'src/products/products.service';
import { Body, Controller, Post } from '@nestjs/common';

@Controller('')
export class ProductsController {
  constructor(private readonly ProductsService: ProductsService) {}

  @Post('api/products/filterAndStoreProduct')
  async filterAndStoreProduct(@Body() data: any): Promise<void> {
    try {
      await this.ProductsService.filterAndStoreProduct(data);
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
      await this.ProductsService.filterAndStoreMultipleProducts(dataArray);
    } catch (error) {
      console.error(
        `Error in filterAndStoreMultipleProducts: ${error.message}`,
      );
      throw new Error(
        `Unable to filter and store multiple products: ${error.message}`,
      );
    }
  }
}
