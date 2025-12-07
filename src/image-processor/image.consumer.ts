import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { cloudImage } from 'src/mongooseShema/image.schema';
import axios from 'axios';

@Processor('image-processor')
@Injectable()
export class ImageConsumer extends WorkerHost {
  private readonly logger = new Logger(ImageConsumer.name);

  constructor(
    private readonly cloudinaryService: CloudinaryService,
    @InjectModel(cloudImage.name) private imageModel: Model<cloudImage>,
  ) {
    super();
  }

  async process(job: Job<any, any, string>): Promise<any> {
    this.logger.debug(`Processing job ${job.id} of type ${job.name}`);
    const { webhookUrl } = job.data;

    try {
      if (job.name === 'upload') {
        const { file, cloudinaryConfig } = job.data;

        let buffer: Buffer;
        if (file.buffer && file.buffer.type === 'Buffer') {
          buffer = Buffer.from(file.buffer.data);
        } else if (file.buffer) {
          buffer = Buffer.from(file.buffer);
        } else {
          throw new Error('Invalid file buffer');
        }

        // Mocking the Express.Multer.File structure
        const uploadFile: any = {
          ...file,
          buffer: buffer,
        };

        const result = await this.cloudinaryService.uploadImage(
          uploadFile,
          cloudinaryConfig,
        );

        await this.imageModel.updateOne(
          { jobId: job.id },
          {
            status: 'completed',
            cloudinaryUrl: result.secure_url,
            publicId: result.public_id,
          },
        );

        if (webhookUrl) {
          try {
            await axios.post(webhookUrl, {
              id: job.id,
              status: 'completed',
              result: { url: result.secure_url },
            });
          } catch (webhookError) {
            this.logger.error(
              `Failed to send webhook for job ${job.id}: ${webhookError.message}`,
            );
          }
        }

        return result;
      }
    } catch (error) {
      this.logger.error(`Job ${job.id} failed: ${error.message}`);
      await this.imageModel.updateOne(
        { jobId: job.id },
        {
          status: 'failed',
          error: error.message,
        },
      );

      if (webhookUrl) {
        try {
          await axios.post(webhookUrl, {
            id: job.id,
            status: 'failed',
            error: error.message,
          });
        } catch (webhookError) {
          this.logger.error(
            `Failed to send webhook failure notification for job ${job.id}: ${webhookError.message}`,
          );
        }
      }
      throw error;
    }
  }
}
