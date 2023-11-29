import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, HydratedDocument } from 'mongoose';

export type WebDocument = HydratedDocument<Web>;

@Schema()
export class Web extends Document {
  @Prop()
  WebName: string;
}

export const WebSchema = SchemaFactory.createForClass(Web);
