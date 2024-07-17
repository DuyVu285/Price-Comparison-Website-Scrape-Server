import { Prop, Schema, SchemaFactory } from '@Nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type UnfilteredProductDocument = HydratedDocument<UnfilteredProduct>;

@Schema({ timestamps: true })
export class UnfilteredProduct {
  @Prop()
  productName: string;

  @Prop({
    type: [String],
  })
  description: string[];

  @Prop()
  price: string;

  @Prop()
  url: string;
}

export const UnfilteredProductSchema = SchemaFactory.createForClass(UnfilteredProduct);
