import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection } from 'mongoose';
import { GridFSBucket, ObjectId } from 'mongodb';
import { Readable } from 'stream';
import * as axios from 'axios';

@Injectable()
export class ImagesService {
  private gfs: GridFSBucket;

  constructor(@InjectConnection() private readonly connection: Connection) {
    this.gfs = new GridFSBucket(this.connection.db, {
      bucketName: 'uploads',
    });
  }

  async getImageById(id: string): Promise<Readable> {
    try {
      const objectId = new ObjectId(id);
      const fileStream = this.gfs.openDownloadStream(objectId);
      return fileStream;
    } catch (error) {
      throw new NotFoundException(`Image with id ${id} not found`);
    }
  }

  async storeImage(imageUrl: string): Promise<ObjectId | null> {
    if (!imageUrl) return null;

    try {
      const response = await axios.default.get(imageUrl, {
        responseType: 'arraybuffer',
      });

      const buffer = Buffer.from(response.data, 'binary');
      const readableStream = new Readable();
      readableStream.push(buffer);
      readableStream.push(null);

      return new Promise((resolve, reject) => {
        const uploadStream = this.gfs.openUploadStream(imageUrl);
        readableStream.pipe(uploadStream);

        uploadStream.on('finish', () => resolve(uploadStream.id));
        uploadStream.on('error', (error) => reject(error));
      });
    } catch (error) {
      console.error(`Error storing image: ${error.message}`);
      return null;
    }
  }

  async getFileStream(filename: string): Promise<Readable> {
    return this.gfs.openDownloadStreamByName(filename);
  }
}
