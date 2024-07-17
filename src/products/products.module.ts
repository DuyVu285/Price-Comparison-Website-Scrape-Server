import { Module } from '@nestjs/common';
import { ProductsService } from './products.service';
import { MongooseModule } from '@nestjs/mongoose';
import { ProductSchema } from 'src/schemas/product.schema';
import { UnfilteredProductSchema } from 'src/schemas/unfiltered-product.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: 'products', schema: ProductSchema }]),
    MongooseModule.forFeature([{ name: 'models', schema: ProductSchema }]),
    MongooseModule.forFeature([
      { name: 'unfiltered-products', schema: UnfilteredProductSchema },
    ]),
  ],
  providers: [ProductsService],
  exports: [ProductsService],
})
export class ProductsModule {}
