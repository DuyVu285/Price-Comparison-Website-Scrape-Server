import { Prop, Schema, SchemaFactory } from '@Nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type ProductDocument = HydratedDocument<Product>;

@Schema({ timestamps: true })
export class Product {
  @Prop()
  productName: string;

  @Prop({
    type: [String],
  })
  description: string[];

  @Prop()
  productCode: string;

  @Prop({
    type: {
      brand: String,
      series: String,
      line: String,
    },
  })
  modelType: {
    brand: string;
    series: string;
    line: string;
  };

  @Prop([
    {
      key: { type: String },
      value: { type: String },
    },
  ])
  prices: { key: string; value: string }[];
}

export const ProductSchema = SchemaFactory.createForClass(Product);
