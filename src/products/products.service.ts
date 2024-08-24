import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Models } from 'src/schemas/model.schema';
import { Product } from 'src/schemas/product.schema';
import { UnfilteredProduct } from 'src/schemas/unfiltered-product.schema';
import * as natural from 'natural';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection } from 'mongoose';
import { GridFSBucket, ObjectId } from 'mongodb';
import { ImagesService } from 'src/images/images.service';

const tokenizer = new natural.WordTokenizer();

@Injectable()
export class ProductsService {
  private gfs: GridFSBucket;

  constructor(
    @InjectModel('products') private readonly product: Model<Product>,
    @InjectModel('models') private readonly model: Model<Models>,
    @InjectModel('unfiltered-products')
    private readonly unfilteredProduct: Model<UnfilteredProduct>,
    @InjectConnection() private readonly connection: Connection,
    private readonly imagesService: ImagesService,
  ) {
    this.gfs = new GridFSBucket(this.connection.db, {
      bucketName: 'uploads',
    });
    this.ensureIndexes();
  }

  async filterAndStoreMultipleProducts(dataArray: any[]): Promise<void> {
    try {
      await Promise.all(
        dataArray.map((data) => this.filterAndStoreProduct(data)),
      );
      console.log('All products processed successfully');
    } catch (error) {
      console.error(
        `Error in filterAndStoreMultipleProducts: ${error.message}`,
      );
      throw new Error(
        `Unable to filter and store multiple products: ${error.message}`,
      );
    }
  }

  async filterAndStoreProduct(data: any): Promise<void> {
    try {
      const modelName = await this.findModelName(data.productName);
      console.log('Product:', modelName);

      let imageId = await this.imagesService.storeImage(data.imageUrl);

      console.log('imageId', imageId);
      if (!imageId) {
        imageId = data.imageId;
      }

      if (!modelName.brand || !modelName.series) {
        await this.upsertUnfilteredProduct(data, imageId);
      } else {
        await this.handleFilteredProduct(data, modelName, imageId);
      }
    } catch (error) {
      console.error(`Error in filterAndStoreProduct: ${error.message}`);
      throw new Error(`Unable to filter and store product: ${error.message}`);
    }
  }

  private async upsertUnfilteredProduct(
    data: any,
    imageId: Types.ObjectId | null,
  ): Promise<void> {
    try {
      const unfilteredProduct = await this.unfilteredProduct.findOneAndUpdate(
        { productName: data.productName },
        {
          $set: {
            description: data.description,
            price: data.price,
            url: data.url,
            imageId,
          },
        },
        { upsert: true, new: true },
      );

      console.log('Unfiltered Product:', unfilteredProduct);
    } catch (error) {
      console.error(`Error upserting unfiltered product: ${error.message}`);
      throw new Error(`Unable to upsert unfiltered product: ${error.message}`);
    }
  }

  private async handleFilteredProduct(
    data: any,
    modelName: any,
    imageId: Types.ObjectId | null,
  ): Promise<void> {
    try {
      const productCode = this.extractProductCode(data.productName, modelName);
      const existingProduct = await this.product.findOne({ productCode });

      if (existingProduct) {
        await this.updateProductPrice(data, productCode);
      } else {
        await this.createNewProduct(data, productCode, modelName, imageId);
      }
    } catch (error) {
      console.error(`Error handling filtered product: ${error.message}`);
      throw new Error(`Unable to handle filtered product: ${error.message}`);
    }
  }

  private async updateProductPrice(
    data: any,
    productCode: string,
  ): Promise<void> {
    try {
      const existingPrice = await this.product.findOne({
        productCode,
        'prices.key': data.url,
      });

      if (existingPrice) {
        await this.product.updateOne(
          { productCode, 'prices.key': data.url },
          { $set: { 'prices.$.value': data.price } },
        );
      } else {
        await this.product.updateOne(
          { productCode },
          {
            $addToSet: {
              prices: {
                key: data.url,
                value: data.price,
              },
            },
          },
        );
      }
    } catch (error) {
      console.error(`Error updating product price: ${error.message}`);
      throw new Error(`Unable to update product price: ${error.message}`);
    }
  }

  private async createNewProduct(
    data: any,
    productCode: string,
    modelName: any,
    imageId: Types.ObjectId | null,
  ): Promise<void> {
    try {
      const productName = data.productName.replace('-', ' ').trim();
      const newProduct = new this.product({
        productName: productName,
        description: data.description,
        productCode,
        modelType: modelName,
        prices: [
          {
            key: data.url,
            value: data.price,
          },
        ],
        imageId,
      });

      await newProduct.save();
    } catch (error) {
      console.error(`Error creating new product: ${error.message}`);
      throw new Error(`Unable to create new product: ${error.message}`);
    }
  }

  async findModelName(productName: string): Promise<{
    brand: string | null;
    series: string | null;
    line: string | null;
  }> {
    const documents = await this.model.find().exec();
    const tokenizer = new natural.WordTokenizer();
    const tokens = tokenizer.tokenize(productName.toLowerCase());

    for (const doc of documents) {
      const { brand, series, line } = doc.toObject();

      if (!brand || !series) {
        continue; // Skip this document if brand or series is not defined
      }

      const brandTokens = tokenizer.tokenize(brand.toLowerCase());
      const seriesTokens = tokenizer.tokenize(series.toLowerCase());
      const lineTokens = line ? tokenizer.tokenize(line.toLowerCase()) : [];

      const brandMatch = brandTokens.every((token) => tokens.includes(token));
      const seriesMatch = seriesTokens.every((token) => tokens.includes(token));
      const lineMatch =
        lineTokens.length === 0 ||
        lineTokens.every((token) => tokens.includes(token));

      if (brandMatch && seriesMatch && lineMatch) {
        return { brand, series, line };
      }
    }

    return { brand: null, series: null, line: null };
  }

  private extractProductCode(productName: string, modelName: any): string {
    const keywordsToRemove = ['laptop', 'gaming'];
    for (const keyword of keywordsToRemove) {
      const keywordRegex = new RegExp(keyword, 'gi');
      productName = productName.replace(keywordRegex, '');
    }

    ['brand', 'series', 'line'].forEach((property) => {
      if (modelName[property]) {
        const propertyRegex = new RegExp(modelName[property], 'i');
        productName = productName.replace(propertyRegex, '');
      }
    });

    productName = productName.replace(/\s+/g, ' ').trim();
    const productCode = productName.replace(/-/g, ' ').trim();
    return productCode;
  }

  async ensureIndexes() {
    const collection = this.product.db.collection(
      this.product.collection.collectionName,
    );
    const indexes = await collection.indexes();
    const indexExists = indexes.some(
      (index) => index.name === 'productName_text',
    );
    if (!indexExists) {
      await collection.createIndex({ productName: 'text' });
    }
  }

  async searchProducts(query: string): Promise<any[]> {
    try {
      const normalizedQuery = query.toLowerCase().trim();

      const fullTextResults = await this.product
        .find({ $text: { $search: normalizedQuery } })
        .exec();

      const regexPattern = new RegExp(
        `.*${normalizedQuery.split(' ').join('.*')}.*`,
        'i',
      );
      const regexResults = await this.product
        .find({ productName: { $regex: regexPattern } })
        .exec();

      const combinedResults = [...fullTextResults, ...regexResults];

      const uniqueResultsMap = new Map<string, any>();
      combinedResults.forEach((product) => {
        if (!uniqueResultsMap.has(product._id.toString())) {
          uniqueResultsMap.set(product._id.toString(), product);
        }
      });

      const uniqueResults = Array.from(uniqueResultsMap.values());

      const scoredResults = uniqueResults.map((product) => {
        const score = this.calculateRelevanceScore(
          product.productName,
          normalizedQuery,
        );
        return { ...product.toObject(), score };
      });

      scoredResults.sort((a, b) => b.score - a.score);
      return scoredResults.slice(0, 5); //
    } catch (error) {
      throw new Error(`Unable to search products: ${error.message}`);
    }
  }

  private calculateRelevanceScore(productName: string, query: string): number {
    const terms = query.split(' ');
    let score = 0;

    terms.forEach((term) => {
      if (productName.toLowerCase().includes(term)) {
        score += 1;
      }
    });

    return score;
  }
}
