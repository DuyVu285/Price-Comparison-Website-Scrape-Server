import { Prop, Schema, SchemaFactory } from '@Nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

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

  @Prop({ type: Types.ObjectId })
  imageId: Types.ObjectId;
}

export const UnfilteredProductSchema = SchemaFactory.createForClass(UnfilteredProduct);
