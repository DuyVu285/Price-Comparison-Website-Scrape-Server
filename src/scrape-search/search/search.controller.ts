import { SearchService } from './search.service';
import { Controller, Get, Param } from '@nestjs/common';

@Controller('search')
export class SearchController {
  constructor(private readonly searchService: SearchService) {}
  @Get(':searchQuery')
  async searchProduct(@Param('searchQuery') searchQuery: string) {
    return this.searchService.searchProduct(searchQuery);
  }
}
