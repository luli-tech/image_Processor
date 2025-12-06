import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { MongooseModule } from '@nestjs/mongoose';
import { ImageProcessorService } from './image-processor.service';
import { ImageConsumer } from './image.consumer';
import { CloudinaryModule } from '../cloudinary/cloudinary.module';
import { Image, ImageSchema } from './schemas/image.schema';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'image-processor',
    }),
    MongooseModule.forFeature([{ name: Image.name, schema: ImageSchema }]),
    CloudinaryModule,
  ],
  providers: [ImageProcessorService, ImageConsumer],
  exports: [ImageProcessorService],
})
export class ImageProcessorModule {}
