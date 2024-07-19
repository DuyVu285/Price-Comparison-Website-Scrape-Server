import { Module } from '@nestjs/common';
import { ImagesService } from './images.service';
import { ImagesController } from './images.controller';
import { MulterModule } from '@nestjs/platform-express';
import { GridFsStorage } from 'multer-gridfs-storage';

@Module({
  imports: [
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
  controllers: [ImagesController],
  providers: [ImagesService],
})
export class ImagesModule {}
