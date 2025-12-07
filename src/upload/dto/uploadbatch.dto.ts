import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class UploadBatchDto {
  @ApiProperty({
    type: 'array',
    items: { type: 'string', format: 'binary' },
    description: 'Select multiple files',
  })
  files: any[]; // Use 'any' or leave it untyped, Swagger only needs the schema

  @ApiPropertyOptional({
    type: 'array',
    items: { type: 'string' },
    description: 'Optional names for each image',
  })
  @ApiPropertyOptional({ description: 'Optional name for image 1' })
  name1?: string;
  @ApiPropertyOptional({ description: 'Optional name for image 2' })
  name2?: string;
  @ApiPropertyOptional({ description: 'Optional name for image 3' })
  name3?: string;
  @ApiPropertyOptional({ description: 'Optional name for image 4' })
  name4?: string;
  @ApiPropertyOptional({ description: 'Optional name for image 5' })
  name5?: string;

  @ApiPropertyOptional({
    type: 'array',
    items: { type: 'string' },
    description: 'Optional tags for image 1',
  })
  tags1?: string[];
  @ApiPropertyOptional({
    type: 'array',
    items: { type: 'string' },
    description: 'Optional tags for image 2',
  })
  tags2?: string[];
  @ApiPropertyOptional({
    type: 'array',
    items: { type: 'string' },
    description: 'Optional tags for image 3',
  })
  tags3?: string[];
  @ApiPropertyOptional({
    type: 'array',
    items: { type: 'string' },
    description: 'Optional tags for image 4',
  })
  tags4?: string[];
  @ApiPropertyOptional({
    type: 'array',
    items: { type: 'string' },
    description: 'Optional tags for image 5',
  })
  tags5?: string[];
}
