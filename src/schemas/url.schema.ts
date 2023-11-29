import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { Web } from './web.schema';
import { Product } from './product.schema';
import * as mongoose from 'mongoose';

export type URLDocument = HydratedDocument<URL>

@Schema()
export class URL {
  @Prop()
  URL: string;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'Product' })
  product: Product;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'Web' })
  web: Web;
}

export const URLSchema = SchemaFactory.createForClass(URL);
