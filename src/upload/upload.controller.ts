
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
import { ApiTags, ApiOperation, ApiResponse, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { ImageProcessorService } from '../image-processor/image-processor.service';

@ApiTags('uploads')
@Controller()
export class UploadController {
  constructor(private readonly imageProcessorService: ImageProcessorService) {}

  @Post('upload')
  @ApiOperation({ summary: 'Upload an image for background processing' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
        type: 'object',
        properties: {
        file: {
            type: 'string',
            format: 'binary',
        },
        },
    },
  })
  @ApiResponse({ status: 201, description: 'The image has been successfully queued for processing.', schema: { example: { jobId: 'uuid', message: 'Image is being processed in the background' } } })
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
        throw new Error('File is missing');
    }
    const jobId = await this.imageProcessorService.processImage(file);
    return { jobId, message: 'Image is being processed in the background' };
  }

  @Get('status/:id')
  @ApiOperation({ summary: 'Get the status of an image processing job' })
  @ApiResponse({ status: 200, description: 'The status of the job.', schema: { 
      example: { 
          id: 'uuid', 
          status: 'completed', 
          result: { url: 'http://cloudinary.com/...' } 
      } 
  }})
  @ApiResponse({ status: 404, description: 'Job not found.' })
  async getStatus(@Param('id') id: string) {
    const status = await this.imageProcessorService.getJobStatus(id);
    if (!status) {
      throw new NotFoundException(`Job with ID ${id} not found`);
    }
    return status;
  }
}
