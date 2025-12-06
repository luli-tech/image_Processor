import { IsNotEmpty, IsObject, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

class CloudinaryConfigDto {
  @ApiProperty({ description: 'Cloudinary Cloud Name' })
  @IsNotEmpty()
  @IsString()
  cloudName: string;

  @ApiProperty({ description: 'Cloudinary API Key' })
  @IsNotEmpty()
  @IsString()
  apiKey: string;

  @ApiProperty({ description: 'Cloudinary API Secret' })
  @IsNotEmpty()
  @IsString()
  apiSecret: string;
}

export class CreateProjectDto {
  @ApiProperty({ description: 'Name of the project' })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({ description: 'Cloudinary Configuration' })
  @IsObject()
  @ValidateNested()
  @Type(() => CloudinaryConfigDto)
  cloudinaryConfig: CloudinaryConfigDto;
}
