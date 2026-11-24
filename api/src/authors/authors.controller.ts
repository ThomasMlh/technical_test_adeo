import { Controller, Get, Param, ParseIntPipe, Query } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { AuthorsService } from './authors.service.js';
import { AuthorDto, AuthorPageDto } from './dto/author-response.dto.js';
import { AuthorsQueryDto } from './dto/authors-query.dto.js';

@ApiTags('authors')
@Controller('authors')
export class AuthorsController {
  constructor(private readonly authors: AuthorsService) {}

  @Get()
  @ApiOperation({ summary: 'List authors, sorted by last name then first name' })
  @ApiOkResponse({ type: AuthorPageDto })
  @ApiBadRequestResponse({ description: 'Invalid or unknown query parameter.' })
  list(@Query() query: AuthorsQueryDto): Promise<AuthorPageDto> {
    return this.authors.list(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get an author' })
  @ApiParam({ name: 'id', example: 1 })
  @ApiOkResponse({ type: AuthorDto })
  @ApiBadRequestResponse({ description: 'The id is not an integer.' })
  @ApiNotFoundResponse({ description: 'No author has this id.' })
  getById(@Param('id', ParseIntPipe) id: number): Promise<AuthorDto> {
    return this.authors.getById(id);
  }
}
