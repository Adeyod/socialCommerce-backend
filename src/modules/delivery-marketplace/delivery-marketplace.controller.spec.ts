import { Test, TestingModule } from '@nestjs/testing';
import { DeliveryMarketplaceController } from './delivery-marketplace.controller';

describe('DeliveryMarketplaceController', () => {
  let controller: DeliveryMarketplaceController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DeliveryMarketplaceController],
    }).compile();

    controller = module.get<DeliveryMarketplaceController>(DeliveryMarketplaceController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
