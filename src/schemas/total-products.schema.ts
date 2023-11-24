import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type TotalProductsDocument = HydratedDocument<TotalProducts>;

interface CollectionData {
    price: number,
    url: string
}

@Schema({ collection: 'products', timestamps: true })
export class TotalProducts {
    @Prop({ required: true })
    name: string;

    @Prop({ type: Object, required: true })
    collections: {
        [collectionName: string]: CollectionData;
    };

    @Prop({ required: true })
    description: string[
        //CPU, RAM, VGA, SSD, Weight, OS, Size, Screen
    ];
}

export const TotalProductsSchema = SchemaFactory.createForClass(TotalProducts);