import { Module } from '@nestjs/common';
import { ProductsService } from './products.service';
import { MongooseModule } from '@nestjs/mongoose';
import { ProductSchema } from 'src/schemas/product.schema';
import { UnfilteredProductSchema } from 'src/schemas/unfiltered-product.schema';
import { ProductsController } from './products.controller';
import { GridFsStorage } from 'multer-gridfs-storage';
import { MulterModule } from '@nestjs/platform-express';
import { ImagesService } from 'src/images/images.service';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: 'products', schema: ProductSchema }]),
    MongooseModule.forFeature([{ name: 'models', schema: ProductSchema }]),
    MongooseModule.forFeature([
      { name: 'unfiltered-products', schema: UnfilteredProductSchema },
    ]),
    MulterModule.registerAsync({
      useFactory: () => {
        const storage = new GridFsStorage({
          url: 'mongodb://127.0.0.1:27017/PriceComparisonWebsite',
          options: { useNewUrlParser: true, useUnifiedTopology: true },
          file: (req, file) => ({
            bucketName: 'uploads',
            filename: `${Date.now()}-${file.originalname}`,
          }),
        });
        return {
          storage,
        };
      },
    }),
  ],
  providers: [ProductsService, ImagesService],
  exports: [ProductsService],
  controllers: [ProductsController],
})
export class ProductsModule {}
