import { Test, TestingModule } from '@nestjs/testing';
import { BusinessShippingRateService } from './business-shipping-rate.service';

describe('BusinessShippingRateService', () => {
  let service: BusinessShippingRateService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [BusinessShippingRateService],
    }).compile();

    service = module.get<BusinessShippingRateService>(BusinessShippingRateService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
