import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { JobStatus } from './image-processor.types';

@Injectable()
export class ImageProcessorService {
  constructor(@InjectQueue('image-upload') private imageQueue: Queue) {}

  async processImage(file: Express.Multer.File): Promise<string> {
    const job = await this.imageQueue.add('upload', { file: { buffer: file.buffer, originalname: file.originalname, mimetype: file.mimetype } });
    return job.id!;
  }

  async getJobStatus(id: string): Promise<JobStatus | undefined> {
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
