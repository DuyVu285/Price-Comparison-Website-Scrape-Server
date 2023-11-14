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
        @InjectModel('cellphoneS-products') private readonly cellphoneSProductModel: Model<Product>,
    ) {
        this.models.set('xgear-products', this.xgearProductModel);
        this.models.set('gearvn-products', this.gearvnProductModel);
        this.models.set('cellphoneS-products', this.cellphoneSProductModel);
    }

    async createMany(products: CreateProductDto[], collectionName: string): Promise<Product[]> {
        const productModel = this.models.get(collectionName);

        if (!productModel) {
            throw new Error('Invalid collectionName');
        }

        const createdProducts = await Promise.all(products.map(async (product) => {
            const createdProduct = await productModel.findOneAndUpdate(
                { name: product.name },
                product,
                { upsert: true, new: true, runValidators: true },
            );
            return createdProduct;
        }));

        return createdProducts;
    }
}
