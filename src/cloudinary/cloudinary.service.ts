import { Injectable } from '@nestjs/common';
import { UploadApiResponse, v2 as cloudinary } from 'cloudinary';
const streamifier = require('streamifier');

@Injectable()
export class CloudinaryService {
  uploadImage(
    file: Express.Multer.File,
    config?: { cloudName: string; apiKey: string; apiSecret: string },
  ): Promise<UploadApiResponse> {
    return new Promise((resolve, reject) => {
      const options: any = {};
      if (config) {
        options.cloud_name = config.cloudName;
        options.api_key = config.apiKey;
        options.api_secret = config.apiSecret;
      }

      const uploadStream = cloudinary.uploader.upload_stream(
        options,
        (error, result) => {
          if (error) return reject(error);
          if (!result)
            return reject(new Error('Cloudinary upload failed (no result)'));
          resolve(result);
        },
      );

      streamifier.createReadStream(file.buffer).pipe(uploadStream);
    });
  }

  deleteImage(publicId: string): Promise<any> {
    return new Promise((resolve, reject) => {
      cloudinary.uploader.destroy(publicId, (error, result) => {
        if (error) return reject(error);
        resolve(result);
      });
    });
  }

  getUrl(
    publicId: string,
    options?: {
      width?: number;
      height?: number;
      crop?: string;
      format?: string;
    },
  ): string {
    return cloudinary.url(publicId, {
      width: options?.width,
      height: options?.height,
      crop: options?.crop || 'fill',
      format: options?.format,
      secure: true,
    });
  }
}
