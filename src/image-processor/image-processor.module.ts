import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ImageProcessorService } from './image-processor.service';
import { ImageConsumer } from './image.consumer';
import { CloudinaryModule } from '../cloudinary/cloudinary.module';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'image-upload',
    }),
    CloudinaryModule,
  ],
  providers: [ImageProcessorService, ImageConsumer],
  exports: [ImageProcessorService],
})
export class ImageProcessorModule {}
