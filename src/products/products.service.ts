import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Models } from 'src/schemas/model.schema';
import { Product } from 'src/schemas/product.schema';
import { UnfilteredProduct } from 'src/schemas/unfiltered-product.schema';

import * as natural from 'natural';
const tokenizer = new natural.WordTokenizer();

@Injectable()
export class ProductsService {
  constructor(
    @InjectModel('products') private readonly product: Model<Product>,
    @InjectModel('models') private readonly model: Model<Models>,
    @InjectModel('unfiltered-products')
    private readonly unfilteredProduct: Model<UnfilteredProduct>,
  ) {}

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
      console.log('Product Brand:', modelName.brand);
      console.log('Product Series:', modelName.series);

      if (!modelName.brand || !modelName.series) {
        await this.upsertUnfilteredProduct(data);
      } else {
        await this.handleFilteredProduct(data, modelName);
      }
    } catch (error) {
      console.error(`Error in filterAndStoreProduct: ${error.message}`);
      throw new Error(`Unable to filter and store product: ${error.message}`);
    }
  }

  private async upsertUnfilteredProduct(data: any): Promise<void> {
    try {
      const unfilteredProduct = await this.unfilteredProduct.findOneAndUpdate(
        { productName: data.productName },
        {
          $set: {
            description: data.description,
            price: data.price,
            url: data.url,
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
  ): Promise<void> {
    try {
      const productCode = this.extractProductCode(data.productName, modelName);
      const existingProduct = await this.product.findOne({ productCode });

      if (existingProduct) {
        await this.updateProductPrice(data, productCode);
      } else {
        await this.createNewProduct(data, productCode, modelName);
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
      });

      await newProduct.save();
    } catch (error) {
      console.error(`Error creating new product: ${error.message}`);
      throw new Error(`Unable to create new product: ${error.message}`);
    }
  }

  private async findModelName(productName: string): Promise<{
    brand: string | null;
    series: string | null;
    line: string | null;
  }> {
    const documents = await this.model.find().exec();

    const tokens = tokenizer.tokenize(productName.toLowerCase());
    console.log('Tokens:', tokens);

    for (const doc of documents) {
      const { brand, series, line } = doc.toObject();

      const brandTokens = tokenizer.tokenize(brand?.toLowerCase());
      const seriesTokens = tokenizer.tokenize(series?.toLowerCase());
      const lineTokens = tokenizer.tokenize(line?.toLowerCase());

      const brandMatch = brandTokens.every((token) => tokens.includes(token));
      const seriesMatch = seriesTokens.every((token) => tokens.includes(token));
      const lineMatch = lineTokens.every((token) => tokens.includes(token));

      if (brandMatch && seriesMatch && lineMatch) {
        return { brand, series, line };
      }
    }

    return {
      brand: null,
      series: null,
      line: null,
    };
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

  async searchProducts(query: string): Promise<Product[]> {
    try {
      const modelName = await this.findModelName(query);
      const productCode = this.extractProductCode(query, modelName);

      const product = await this.product
        .find({ productName: { $regex: new RegExp(productCode, 'i') } })
        .exec();
      return product;
    } catch (error) {
      throw new Error(`Unable to search products: ${error.message}`);
    }
  }
}
