import { IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UploadImageDto {
  @ApiPropertyOptional({ description: 'Optional name for the image' })
  @IsOptional()
  @IsString()
  name?: string;
}
