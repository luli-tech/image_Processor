import { Module } from '@nestjs/common';
import { UploadController } from './upload.controller';
import { ImageProcessorModule } from '../image-processor/image-processor.module';
import { ProjectsModule } from '../projects/projects.module';

@Module({
  imports: [ImageProcessorModule, ProjectsModule],
  controllers: [UploadController],
})
export class UploadModule {}
