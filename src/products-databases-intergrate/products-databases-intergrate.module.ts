import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ProductsDatabasesIntergrateService } from './products-databases-intergrate.service';
import { ProductSchema } from 'src/schemas/product.schema';
import { TotalProductsSchema } from 'src/schemas/total-products.schema';

@Module({
    imports: [
        MongooseModule.forFeature([
          { name: 'xgear-products', schema: ProductSchema },
          { name: 'gearvn-products', schema: ProductSchema },
          { name: 'fptshop-products', schema: ProductSchema },
          { name: 'products', schema: TotalProductsSchema},
        ]),
      ],
    providers: [ProductsDatabasesIntergrateService],
    exports: [ProductsDatabasesIntergrateService]
})
export class ProductsDatabasesIntergrateModule {}
