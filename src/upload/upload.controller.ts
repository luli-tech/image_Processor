
import {
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
  Get,
  Param,
  NotFoundException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ImageProcessorService } from '../image-processor/image-processor.service';

@Controller()
export class UploadController {
  constructor(private readonly imageProcessorService: ImageProcessorService) {}

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  uploadFile(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
        throw new Error('File is missing');
    }
    const jobId = this.imageProcessorService.processImage(file);
    return { jobId, message: 'Image is being processed in the background' };
  }

  @Get('status/:id')
  getStatus(@Param('id') id: string) {
    const status = this.imageProcessorService.getJobStatus(id);
    if (!status) {
      throw new NotFoundException(`Job with ID ${id} not found`);
    }
    return status;
  }
}
