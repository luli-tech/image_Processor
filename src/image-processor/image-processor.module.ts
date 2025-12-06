
import { Module } from '@nestjs/common';
import { ImageProcessorService } from './image-processor.service';
import { CloudinaryModule } from '../cloudinary/cloudinary.module';

@Module({
  imports: [CloudinaryModule],
  providers: [ImageProcessorService],
  exports: [ImageProcessorService],
})
export class ImageProcessorModule {}
