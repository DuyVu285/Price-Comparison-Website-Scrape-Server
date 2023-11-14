import { Test, TestingModule } from '@nestjs/testing';
import { GearvnScraperService } from './gearvn-scraper.service';

describe('GearvnScraperService', () => {
  let service: GearvnScraperService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [GearvnScraperService],
    }).compile();

    service = module.get<GearvnScraperService>(GearvnScraperService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
