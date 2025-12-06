
import { Module } from '@nestjs/common';
import { UploadController } from './upload.controller';
import { ImageProcessorModule } from '../image-processor/image-processor.module';

@Module({
  imports: [ImageProcessorModule],
  controllers: [UploadController],
})
export class UploadModule {}
