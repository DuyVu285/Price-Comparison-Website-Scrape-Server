import { Test, TestingModule } from '@nestjs/testing';
import { PhongvuScraperService } from './phongvu-scraper.service';

describe('PhongvuScraperService', () => {
  let service: PhongvuScraperService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PhongvuScraperService],
    }).compile();

    service = module.get<PhongvuScraperService>(PhongvuScraperService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
