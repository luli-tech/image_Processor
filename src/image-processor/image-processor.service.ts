import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { JobStatus } from './image-processor.types';
import { Image } from './schemas/image.schema';

@Injectable()
export class ImageProcessorService {
  constructor(
    @InjectQueue('image-processor') private imageQueue: Queue,
    @InjectModel(Image.name) private imageModel: Model<Image>,
  ) {}

  async processImage(file: Express.Multer.File): Promise<string> {
    const job = await this.imageQueue.add('upload', {
      file: {
        buffer: file.buffer,
        originalname: file.originalname,
        mimetype: file.mimetype,
      },
    });

    const createdImage = new this.imageModel({
      originalName: file.originalname,
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
}
