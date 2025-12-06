import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { JobStatus } from './image-processor.types';
import { Image } from 'src/mongooseShema/image.schema';
import { CloudinaryService } from '../cloudinary/cloudinary.service';

@Injectable()
export class ImageProcessorService {
  constructor(
    @InjectQueue('image-processor') private imageQueue: Queue,
    @InjectModel(Image.name) private imageModel: Model<Image>,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

  async processImage(file: Express.Multer.File, name?: string, tags?: string[], webhookUrl?: string, cloudinaryConfig?: any): Promise<string> {
    const job = await this.imageQueue.add('upload', {
      file: {
        buffer: file.buffer,
        originalname: file.originalname,
        mimetype: file.mimetype,
      },
      webhookUrl,
      cloudinaryConfig, // Pass tenant config
    });

    const createdImage = new this.imageModel({
      originalName: file.originalname,
      name: name || file.originalname,
      tags: tags || [],
      webhookUrl,
      mimetype: file.mimetype,
      jobId: job.id,
      status: 'pending',
    });
    await createdImage.save();

    return job.id!;
  }

  async getJobStatus(id: string): Promise<JobStatus | undefined> {
    // Check DB first for authoritative status
    const imageRecord = await this.imageModel.findOne({ jobId: id }).exec();

    if (imageRecord && imageRecord.status !== 'pending') {
         return {
            id: imageRecord.jobId,
            status: imageRecord.status as 'completed' | 'failed',
            result: imageRecord.cloudinaryUrl ? { url: imageRecord.cloudinaryUrl } : undefined,
            error: imageRecord.error,
         }
    }

    // Fallback to Queue status if still pending (or not found in DB if something went wrong)
    const job = await this.imageQueue.getJob(id);
    if (!job) {
        return undefined;
    }
    
    // BullMQ job states: active, completed, failed, delayed, waiting
    // Our logical states: processing, completed, failed
    
    const state = await job.getState();
    let status: 'processing' | 'completed' | 'failed';
    
    if (state === 'completed') {
        status = 'completed';
    } else if (state === 'failed') {
        status = 'failed';
    } else {
        status = 'processing';
    }

    return {
        id: job.id!,
        status,
        result: job.returnvalue,
        error: job.failedReason
    };
  }
  async findAll(status?: string, page: number = 1, limit: number = 10, tag?: string): Promise<{ data: Image[]; total: number; page: number; limit: number }> {
    const filter: any = {};
    if (status) filter.status = status;
    if (tag) filter.tags = tag;

    const skip = (page - 1) * limit;
    
    const [data, total] = await Promise.all([
        this.imageModel.find(filter).skip(skip).limit(limit).exec(),
        this.imageModel.countDocuments(filter).exec(),
    ]);

    return { data, total, page, limit };
  }

  async findOne(id: string): Promise<Image | undefined> {
    const result = await this.imageModel.findById(id).exec();
    return result || undefined;
  }

  async delete(id: string): Promise<void> {
    const image = await this.imageModel.findById(id).exec();
    if (!image) {
        throw new Error('Image not found');
    }

    if (image.publicId) {
        try {
             await this.cloudinaryService.deleteImage(image.publicId);
        } catch (e) {
            console.error('Failed to delete from Cloudinary', e);
        }
    }
    
    await this.imageModel.findByIdAndDelete(id).exec();
  }

  async update(id: string, updateData: { name?: string; tags?: string[] }): Promise<Image | null> {
    return this.imageModel.findByIdAndUpdate(id, updateData, { new: true }).exec();
  }

  async getUrl(id: string, options?: { width?: number; height?: number; crop?: string; format?: string }): Promise<string> {
      const image = await this.imageModel.findById(id).exec();
      if (!image || !image.publicId) {
          throw new Error('Image not found or not processed');
      }
      return this.cloudinaryService.getUrl(image.publicId, options);
  }
}
