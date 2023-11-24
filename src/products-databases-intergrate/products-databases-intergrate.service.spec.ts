import { Test, TestingModule } from '@nestjs/testing';
import { ProductsDatabasesIntergrateService } from './products-databases-intergrate.service';

describe('ProductsDatabasesIntergrateService', () => {
  let service: ProductsDatabasesIntergrateService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ProductsDatabasesIntergrateService],
    }).compile();

    service = module.get<ProductsDatabasesIntergrateService>(ProductsDatabasesIntergrateService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
