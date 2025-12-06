import { IsString, IsNotEmpty, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateImageDto {
  @ApiProperty({ description: 'New name for the image' })
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  name: string;
}
