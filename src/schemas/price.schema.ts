import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { Product } from './product.schema';
import { Web } from './web.schema';
import * as mongoose from 'mongoose';

export type PriceDocument = HydratedDocument<Price>;

@Schema()
export class Price {
  @Prop()
  price: number;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'Product' })
  product: Product;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'Web' })
  web: Web;
}

export const PriceSchema = SchemaFactory.createForClass(Price);
