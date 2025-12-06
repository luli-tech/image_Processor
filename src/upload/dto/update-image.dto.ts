import { IsString, IsNotEmpty, MinLength, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateImageDto {
  @ApiProperty({ description: 'New name for the image', required: false })
  @IsOptional()
  @IsString()
  @MinLength(1)
  name?: string;

  @ApiProperty({ description: 'Tags for the image', required: false, type: [String] })
  @IsOptional()
  @IsString({ each: true })
  tags?: string[];
}
