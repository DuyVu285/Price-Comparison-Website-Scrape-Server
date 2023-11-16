import { Module } from '@nestjs/common';
import { ProductsService } from './products.service';
import { MongooseModule } from '@nestjs/mongoose';
import { Product, ProductSchema } from 'src/schemas/product.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: 'xgear-products', schema: ProductSchema },
      { name: 'gearvn-products', schema: ProductSchema },
      { name: 'fptshop-products', schema: ProductSchema },
    ]),
  ],
  providers: [ProductsService],
  exports: [ProductsService],
})
export class ProductsModule { }
