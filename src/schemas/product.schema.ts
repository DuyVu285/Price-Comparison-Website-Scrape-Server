import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type ProductDocument = HydratedDocument<Product>;
// Fix this later with the improve database
@Schema({ timestamps: true })
export class Product extends Document {
    @Prop({ required: true })
    name: string;

    @Prop({ type: Number })
    price?: number;

    @Prop()
    brand: string;

    @Prop()
    model: string;

    @Prop()
    line: string;

    @Prop() 
    variant: string;

    @Prop()
    description: {
        cpu?: string;
        ram?: string;
        vga?: string;
        ssd?: string;
    };

    @Prop({ required: true })
    url: string;
}

export const ProductSchema = SchemaFactory.createForClass(Product);
