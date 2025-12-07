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
  UseGuards,
  UploadedFiles,
  Req,
} from '@nestjs/common';
import { ApiKeyGuard } from '../auth/api-key.guard';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiConsumes,
  ApiBody,
  ApiSecurity,
} from '@nestjs/swagger';
import { ImageProcessorService } from '../image-processor/image-processor.service';
import { GetImagesFilterDto } from './dto/get-images.dto';
import { UpdateImageDto } from './dto/update-image.dto';
import { UploadImageDto } from './dto/upload-image.dto';
import { UploadBatchDto } from './dto/uploadbatch.dto';

@ApiTags('uploads')
@Controller()
export class UploadController {
  constructor(private readonly imageProcessorService: ImageProcessorService) {}

  @Post('upload')
  @UseGuards(ApiKeyGuard)
  @ApiSecurity('api_key')
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
        tags: {
          type: 'array',
          items: { type: 'string' },
          description: 'Optional tags',
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'The image has been successfully queued for processing.',
    schema: {
      example: {
        jobId: 'uuid',
        message: 'Image is being processed in the background',
      },
    },
  })
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(
    @UploadedFile() file: Express.Multer.File,
    @Body() uploadImageDto: UploadImageDto,
    @Req() req: any,
  ) {
    if (!file) {
      throw new Error('File is missing');
    }
    const project = req.project;
    const cloudinaryConfig = project ? project.cloudinaryConfig : undefined;

    const jobId = await this.imageProcessorService.processImage(
      file,
      uploadImageDto.name,
      uploadImageDto.tags,
      uploadImageDto.webhookUrl,
      cloudinaryConfig,
    );
    return { jobId, message: 'Image is being processed in the background' };
  }

  @Post('upload/batch')
  @UseGuards(ApiKeyGuard)
  @ApiSecurity('api_key')
  @ApiOperation({ summary: 'Upload multiple images for background processing' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({ type: UploadBatchDto })
  @ApiResponse({
    status: 201,
    description: 'The images have been successfully queued for processing.',
    schema: {
      example: {
        jobIds: ['uuid1', 'uuid2'],
        message: '2 images queued for processing',
      },
    },
  })
  @UseInterceptors(FilesInterceptor('files', 5)) // Limit to 5 files
  async uploadFiles(
    @Req() req: any,
    @UploadedFiles() files: Array<Express.Multer.File>,
    @Body() uploadBatchDto: UploadBatchDto,
  ) {
    if (!files || files.length === 0) throw new Error('Files are missing');
    if (files.length > 5) throw new Error('Maximum 5 files allowed per batch');

    const names = [
      uploadBatchDto.name1,
      uploadBatchDto.name2,
      uploadBatchDto.name3,
      uploadBatchDto.name4,
      uploadBatchDto.name5,
    ].filter(Boolean) as string[];

    const tags = [
      uploadBatchDto.tags1,
      uploadBatchDto.tags2,
      uploadBatchDto.tags3,
      uploadBatchDto.tags4,
      uploadBatchDto.tags5,
    ].filter(Boolean) as string[][];

    if (names.length > 0 && names.length !== files.length) {
      throw new Error('Number of names must match number of files');
    }
    if (tags.length > 0 && tags.length !== files.length) {
      throw new Error('Number of tag arrays must match number of files');
    }

    const project = req.project;
    const cloudinaryConfig = project ? project.cloudinaryConfig : undefined;

    const jobs = await this.imageProcessorService.processBatchImages(
      files,
      names,
      tags,
      cloudinaryConfig,
    );

    return {
      jobIds: jobs,
      message: `${files.length} images queued for processing`,
    };
  }

  @Get('status/:id')
  @ApiOperation({ summary: 'Get the status of an image processing job' })
  @ApiResponse({
    status: 200,
    description: 'The status of the job.',
    schema: {
      example: {
        id: 'uuid',
        status: 'completed',
        result: { url: 'http://cloudinary.com/...' },
      },
    },
  })
  @ApiResponse({ status: 404, description: 'Job not found.' })
  async getStatus(@Param('id') id: string) {
    const status = await this.imageProcessorService.getJobStatus(id);
    if (!status) {
      throw new NotFoundException(`Job with ID ${id} not found`);
    }
    return status;
  }

  @Get('images')
  @ApiOperation({
    summary: 'Get all images, optionally filtered by status or tag',
  })
  @ApiResponse({ status: 200, description: 'List of images.' })
  async findAll(@Query() filterDto: GetImagesFilterDto) {
    return this.imageProcessorService.findAll(
      filterDto.status,
      filterDto.page,
      filterDto.limit,
      filterDto.tag,
    );
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
  @UseGuards(ApiKeyGuard)
  @ApiSecurity('api_key')
  @ApiOperation({ summary: 'Delete an image by ID' })
  @ApiResponse({ status: 200, description: 'Image deleted.' })
  @ApiResponse({ status: 404, description: 'Image not found.' })
  async delete(@Param('id') id: string) {
    await this.imageProcessorService.delete(id);
    return { message: 'Image deleted successfully' };
  }

  @Delete('images/batch')
  @UseGuards(ApiKeyGuard)
  @ApiSecurity('api_key')
  @ApiOperation({ summary: 'Delete multiple images by IDs' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: { ids: { type: 'array', items: { type: 'string' } } },
    },
  })
  async deleteBatch(@Body('ids') ids: string[]) {
    if (!ids || ids.length === 0) {
      throw new Error('IDs are missing');
    }
    await Promise.all(ids.map((id) => this.imageProcessorService.delete(id)));
    return { message: `${ids.length} images deleted successfully` };
  }

  @Patch('images/:id')
  @UseGuards(ApiKeyGuard)
  @ApiSecurity('api_key')
  @ApiOperation({ summary: 'Update image name and tags' })
  @ApiBody({ type: UpdateImageDto })
  async update(
    @Param('id') id: string,
    @Body() updateImageDto: UpdateImageDto,
  ) {
    const updatedImage = await this.imageProcessorService.update(
      id,
      updateImageDto,
    );
    if (!updatedImage) {
      throw new NotFoundException(`Image with ID ${id} not found`);
    }
    return updatedImage;
  }

  @Get('images/:id/url')
  @ApiOperation({ summary: 'Get transformed image URL' })
  @ApiResponse({ status: 200, description: 'The transformed URL.' })
  async getUrl(
    @Param('id') id: string,
    @Query('w') w?: number,
    @Query('h') h?: number,
    @Query('fit') fit?: string,
    @Query('format') format?: string,
  ) {
    const url = await this.imageProcessorService.getUrl(id, {
      width: w ? Number(w) : undefined,
      height: h ? Number(h) : undefined,
      crop: fit,
      format,
    });
    return { url };
  }
}
