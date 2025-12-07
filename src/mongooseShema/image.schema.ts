import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type ImageDocument = HydratedDocument<cloudImage>;

@Schema({ timestamps: true })
export class cloudImage {
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

  @Prop({
    required: true,
    enum: ['pending', 'completed', 'failed'],
    default: 'pending',
  })
  status: string;

  @Prop()
  error: string;

  @Prop({ type: [String], index: true, default: [] })
  tags: string[];

  @Prop()
  webhookUrl: string;
}

export const ImageSchema = SchemaFactory.createForClass(cloudImage);
