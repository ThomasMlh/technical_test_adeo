import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, Max, Min } from 'class-validator';

export class RankingQueryDto {
  @ApiPropertyOptional({ description: 'Number of products to return.', minimum: 1, maximum: 50, default: 5 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  limit: number = 5;
}
