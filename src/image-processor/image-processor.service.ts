
import { Injectable } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { CloudinaryService } from '../cloudinary/cloudinary.service';

export interface JobStatus {
  id: string;
  status: 'processing' | 'completed' | 'failed';
  result?: any;
  error?: any;
}

@Injectable()
export class ImageProcessorService {
  private jobs = new Map<string, JobStatus>();

  constructor(private readonly cloudinaryService: CloudinaryService) {}

  processImage(file: Express.Multer.File): string {
    const id = uuidv4();
    this.jobs.set(id, { id, status: 'processing' });

    // Background processing
    this.cloudinaryService
      .uploadImage(file)
      .then((result) => {
        this.jobs.set(id, { id, status: 'completed', result });
      })
      .catch((error) => {
        this.jobs.set(id, { id, status: 'failed', error });
      });

    return id;
  }

  getJobStatus(id: string): JobStatus | undefined {
    return this.jobs.get(id);
  }
}
