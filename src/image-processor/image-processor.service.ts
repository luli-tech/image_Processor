import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue, JobsOptions } from 'bullmq';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { JobStatus } from './image-processor.types';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
import { cloudImage } from 'src/mongooseShema/image.schema';

export interface CloudinaryConfig {
  cloudName: string;
  apiKey: string;
  apiSecret: string;
}

export interface UploadJobData {
  file: {
    buffer: Buffer;
    originalname: string;
    mimetype: string;
  };
  webhookUrl?: string;
  cloudinaryConfig?: CloudinaryConfig;
}

@Injectable()
export class ImageProcessorService {
  constructor(
    @InjectQueue('image-processor') private readonly imageQueue: Queue,
    @InjectModel(cloudImage.name)
    private readonly imageModel: Model<cloudImage>,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

  //process barch image
  async processBatchImages(
    files: Express.Multer.File[],
    names: string[] = [],
    tags: string[][] = [],
    cloudinaryConfig?: CloudinaryConfig,
  ): Promise<string[]> {
    const jobs: string[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const name = names[i] || `IMG-${i + 1}`;
      const imageTags = tags[i] || [];

      const jobId = await this.processImage(
        file,
        name,
        imageTags,
        undefined,
        cloudinaryConfig,
      );
      jobs.push(jobId);
    }

    return jobs;
  }

  // it ends here

  async processImage(
    file: Express.Multer.File,
    name?: string,
    tags?: string[],
    webhookUrl?: string,
    cloudinaryConfig?: CloudinaryConfig,
  ): Promise<string> {
    const jobOptions: JobsOptions = {
      removeOnComplete: false,
      removeOnFail: false,
    };

    const job = await this.imageQueue.add(
      'upload',
      {
        file: {
          buffer: file.buffer,
          originalname: file.originalname,
          mimetype: file.mimetype,
        },
        webhookUrl,
        cloudinaryConfig,
      },
      {
        ...jobOptions,
        removeOnComplete: true,
        removeOnFail: false,
      },
    );

    // const createdImage = new this.imageModel({
    //   originalName: file.originalname,
    //   name: name ?? file.originalname,
    //   tags: tags ?? [],
    //   webhookUrl,
    //   mimetype: file.mimetype,
    //   jobId: job.id,
    //   status: 'pending',
    // });

    // await createdImage.save();
    const existing = await this.imageModel.findOne({ jobId: job.id });
    if (!existing) {
      const createdImage = new this.imageModel({
        originalName: file.originalname,
        name: name ?? file.originalname,
        tags: tags ?? [],
        webhookUrl,
        mimetype: file.mimetype,
        jobId: job.id,
        status: 'pending',
      });
      await createdImage.save();
    }

    return String(job.id);
  }

  async getJobStatus(id: string): Promise<JobStatus | undefined> {
    const imageRecord = await this.imageModel.findOne({ jobId: id }).exec();

    if (imageRecord && imageRecord.status !== 'pending') {
      return {
        id: imageRecord.jobId,
        status: imageRecord.status as 'completed' | 'failed',
        result: imageRecord.cloudinaryUrl
          ? { url: imageRecord.cloudinaryUrl }
          : undefined,
        error: imageRecord.error ?? undefined,
      };
    }

    const job = await this.imageQueue.getJob(id);
    if (!job) return undefined;

    const state = await job.getState();

    let status: 'processing' | 'completed' | 'failed';
    if (state === 'completed') status = 'completed';
    else if (state === 'failed') status = 'failed';
    else status = 'processing';

    return {
      id: String(job.id),
      status,
      result: (await job.returnvalue) ?? undefined,
      error: job.failedReason ?? undefined,
    };
  }

  async findAll(
    status?: string,
    page = 1,
    limit = 10,
    tag?: string,
  ): Promise<{
    data: cloudImage[];
    total: number;
    page: number;
    limit: number;
  }> {
    const filter: Record<string, unknown> = {};
    if (status) filter.status = status;
    if (tag) filter.tags = tag;

    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.imageModel.find(filter).skip(skip).limit(limit).exec(),
      this.imageModel.countDocuments(filter).exec(),
    ]);

    return { data, total, page, limit };
  }

  async findOne(id: string): Promise<cloudImage | undefined> {
    const result = await this.imageModel.findById(id).exec();
    return result ?? undefined;
  }

  async delete(id: string): Promise<void> {
    const image = await this.imageModel.findById(id).exec();
    if (!image) {
      throw new Error('Image not found');
    }

    if (image.publicId) {
      try {
        await this.cloudinaryService.deleteImage(image.publicId);
      } catch (error) {
        console.error('Failed to delete Cloudinary asset:', error);
      }
    }

    await this.imageModel.findByIdAndDelete(id).exec();
  }

  async update(
    id: string,
    updateData: { name?: string; tags?: string[] },
  ): Promise<cloudImage | null> {
    return this.imageModel
      .findByIdAndUpdate(id, updateData, { new: true })
      .exec();
  }

  async getUrl(
    id: string,
    options?: {
      width?: number;
      height?: number;
      crop?: string;
      format?: string;
    },
  ): Promise<string> {
    const image = await this.imageModel.findById(id).exec();
    if (!image || !image.publicId) {
      throw new Error('Image not found or not processed');
    }

    return this.cloudinaryService.getUrl(image.publicId, options);
  }
}
