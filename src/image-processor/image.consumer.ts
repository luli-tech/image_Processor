import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
import { Injectable, Logger } from '@nestjs/common';

@Processor('image-upload')
@Injectable()
export class ImageConsumer extends WorkerHost {
  private readonly logger = new Logger(ImageConsumer.name);

  constructor(private readonly cloudinaryService: CloudinaryService) {
    super();
  }

  async process(job: Job<any, any, string>): Promise<any> {
    this.logger.debug(`Processing job ${job.id} of type ${job.name}`);
    
    if (job.name === 'upload') {
        const { file } = job.data;
        // Reconstruct buffer from serializable object if necessary. 
        // Note: For this example, we assume `file` is passed in a way compatible with what CloudinaryService expects 
        // or we need to reconstruct the buffer.
        // `file` from Multer usually has a Buffer which is not JSON serializable directly as a buffer object 
        // but might be serialized as a `{ type: 'Buffer', data: [...] }` object by JSON.stringify.
        // We will need to handle this reconstruction.
        
        let buffer: Buffer;
        if (file.buffer && file.buffer.type === 'Buffer') {
             buffer = Buffer.from(file.buffer.data);
        } else if (file.buffer) {
             // If it's acting like a buffer or string
              buffer = Buffer.from(file.buffer);
        } else {
            throw new Error('Invalid file buffer');
        }

        // Mocking the Express.Multer.File structure
        const uploadFile: any = {
            ...file,
            buffer: buffer
        };
        
        return this.cloudinaryService.uploadImage(uploadFile);
    }
  }
}
