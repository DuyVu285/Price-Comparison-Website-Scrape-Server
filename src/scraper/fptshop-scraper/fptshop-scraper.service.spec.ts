import { Test, TestingModule } from '@nestjs/testing';
import { FptshopScraperService } from './fptshop-scraper.service';

describe('FptshopScraperService', () => {
  let service: FptshopScraperService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [FptshopScraperService],
    }).compile();

    service = module.get<FptshopScraperService>(FptshopScraperService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
