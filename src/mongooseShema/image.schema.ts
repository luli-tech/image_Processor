import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type ImageDocument = HydratedDocument<Image>;

@Schema({ timestamps: true })
export class Image {
  @Prop({ required: true })
  originalName: string;

  @Prop()
  name: string;

  @Prop({ required: true })
  mimetype: string;

  @Prop({ required: true, unique: true })
  jobId: string;

  @Prop()
  cloudinaryUrl: string;

  @Prop()
  publicId: string;

  @Prop({ required: true, enum: ['pending', 'completed', 'failed'], default: 'pending' })
  status: string;

  @Prop()
  error: string;
}

export const ImageSchema = SchemaFactory.createForClass(Image);
