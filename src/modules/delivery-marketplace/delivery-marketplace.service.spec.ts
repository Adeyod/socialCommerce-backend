import { Test, TestingModule } from '@nestjs/testing';
import { DeliveryMarketplaceService } from './delivery-marketplace.service';

describe('DeliveryMarketplaceService', () => {
  let service: DeliveryMarketplaceService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [DeliveryMarketplaceService],
    }).compile();

    service = module.get<DeliveryMarketplaceService>(DeliveryMarketplaceService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
