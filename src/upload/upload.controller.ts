
import {
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
  Get,
  Param,
  NotFoundException,
  Delete,
  Query,
  Body,
  Patch,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiResponse, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { ImageProcessorService } from '../image-processor/image-processor.service';
import { GetImagesFilterDto } from './dto/get-images.dto';
import { UpdateImageDto } from './dto/update-image.dto';
import { UploadImageDto } from './dto/upload-image.dto';

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
        name: {
            type: 'string',
            description: 'Optional name for the image',
        },
        },
    },
  })
  @ApiResponse({ status: 201, description: 'The image has been successfully queued for processing.', schema: { example: { jobId: 'uuid', message: 'Image is being processed in the background' } } })
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(@UploadedFile() file: Express.Multer.File, @Body() uploadImageDto: UploadImageDto) {
    if (!file) {
        throw new Error('File is missing');
    }
    const jobId = await this.imageProcessorService.processImage(file, uploadImageDto.name);
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

  @Get('images')
  @ApiOperation({ summary: 'Get all images, optionally filtered by status' })
  @ApiResponse({ status: 200, description: 'List of images.' })
  async findAll(@Query() filterDto: GetImagesFilterDto) {
    return this.imageProcessorService.findAll(filterDto.status, filterDto.page, filterDto.limit);
  }

  @Get('images/:id')
  @ApiOperation({ summary: 'Get an image by ID' })
  @ApiResponse({ status: 200, description: 'The image.' })
  @ApiResponse({ status: 404, description: 'Image not found.' })
  async findOne(@Param('id') id: string) {
    const image = await this.imageProcessorService.findOne(id);
    if (!image) {
        throw new NotFoundException(`Image with ID ${id} not found`);
    }
    return image;
  }

  @Post('images/:id/delete') // Using POST for delete if DELETE method not preferred or for ease, but standard is DELETE.
  // Actually let's use standard Delete
  @Delete('images/:id')
  @ApiOperation({ summary: 'Delete an image by ID' })
  @ApiResponse({ status: 200, description: 'Image deleted.' })
  @ApiResponse({ status: 404, description: 'Image not found.' })
  async delete(@Param('id') id: string) {
    await this.imageProcessorService.delete(id);
    return { message: 'Image deleted successfully' };
  }

  @Patch('images/:id')
  @ApiOperation({ summary: 'Update image name' })
  @ApiBody({ type: UpdateImageDto })
  async updateName(@Param('id') id: string, @Body() updateImageDto: UpdateImageDto) {
    const updatedImage = await this.imageProcessorService.updateName(id, updateImageDto.name);
    if (!updatedImage) {
        throw new NotFoundException(`Image with ID ${id} not found`);
    }
    return updatedImage;
  }
}
