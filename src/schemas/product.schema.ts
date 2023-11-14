import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type ProductDocument = HydratedDocument<Product>;

@Schema()
export class Product {
    @Prop({ required: true })
    name: string;

    @Prop()
    price: number;

    @Prop({ required: true })
    description: string[];

    @Prop({ required: true })
    imageUrl: string;

    @Prop({ required: true })
    baseUrl: string;

    @Prop({ default: Date.now })
    createdAt: Date;

    @Prop({ default: Date.now })
    updatedAt: Date;
}

export const ProductSchema = SchemaFactory.createForClass(Product);