import { Test, TestingModule } from '@nestjs/testing';
import { BusinessShippingRateController } from './business-shipping-rate.controller';

describe('BusinessShippingRateController', () => {
  let controller: BusinessShippingRateController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [BusinessShippingRateController],
    }).compile();

    controller = module.get<BusinessShippingRateController>(BusinessShippingRateController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
