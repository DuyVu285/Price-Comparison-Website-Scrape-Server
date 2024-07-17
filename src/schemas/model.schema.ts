import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type ModelsDocument = HydratedDocument<Models>;

@Schema()
export class Models {
  @Prop()
  brand: string;

  @Prop()
  series: string;

  @Prop()
  line: string;
}

export const ModelSchema = SchemaFactory.createForClass(Models);
