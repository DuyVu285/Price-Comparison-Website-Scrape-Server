import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type ModelDocument = HydratedDocument<Model>;

@Schema()
export class Model {
  @Prop()
  brand: string;

  @Prop()
  series: string;

  @Prop()
  line: string;

  @Prop()
  image: string;
}

export const ModelSchema = SchemaFactory.createForClass(Model);
