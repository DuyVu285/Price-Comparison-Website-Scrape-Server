import { Injectable } from '@nestjs/common';
import { CreateProductDto } from './dto/create-products.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Product } from 'src/schemas/product.schema';

@Injectable()
export class ProductsService {
    private readonly models: Map<string, Model<Product>> = new Map<string, Model<Product>>();

    constructor(
        @InjectModel('xgear-products') private readonly xgearProductModel: Model<Product>,
        @InjectModel('gearvn-products') private readonly gearvnProductModel: Model<Product>,
        @InjectModel('fptshop-products') private readonly fptshopProductModel: Model<Product>,
    ) {
        this.models.set('xgear-products', this.xgearProductModel);
        this.models.set('gearvn-products', this.gearvnProductModel);
        this.models.set('fptshop-products', this.fptshopProductModel);
    }

    async createMany(products: CreateProductDto[], collectionName: string): Promise<Product[]> {
        const uniqueProducts = Array.from(new Set(products.map(product => product.name)))
        .map(name => products.find(product => product.name === name));

        const productModel = this.models.get(collectionName);
    
        if (!productModel) {
            throw new Error('Invalid collectionName');
        }
    
        const createdProducts = await Promise.all(uniqueProducts.map(async (product) => {
            const existingProduct = await productModel.findOne({ name: product.name });
    
            if (existingProduct) {
                const { price, description, imageUrl, baseUrl } = product;
                const version = existingProduct.__v || 0; // Access version from existing document
    
                const updatedProduct = await productModel.findOneAndUpdate(
                    { _id: existingProduct._id, __v: version },
                    { $set: { price, description, imageUrl, baseUrl, updatedAt: new Date() } },
                    { new: true, runValidators: true }
                );
    
                if (!updatedProduct) {
                    // Handle version conflict
                    throw new Error(`Version conflict for product with id ${existingProduct._id}`);
                }
    
                return updatedProduct;
            } else {
                const newProduct = new productModel({
                    ...product,
                    updatedAt: new Date(),
                });
    
                const createdProduct = await newProduct.save();
                return createdProduct;
            }
        }));
    
        return createdProducts;
    }
    
}
