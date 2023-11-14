import { Test, TestingModule } from '@nestjs/testing';
import { XgearScraperService } from './xgear-scraper.service';

describe('XgearScraperService', () => {
  let service: XgearScraperService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [XgearScraperService],
    }).compile();

    service = module.get<XgearScraperService>(XgearScraperService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
