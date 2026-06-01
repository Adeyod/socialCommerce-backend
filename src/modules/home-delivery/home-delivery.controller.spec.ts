import { Test, TestingModule } from '@nestjs/testing';
import { HomeDeliveryController } from './home-delivery.controller';

describe('HomeDeliveryController', () => {
  let controller: HomeDeliveryController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [HomeDeliveryController],
    }).compile();

    controller = module.get<HomeDeliveryController>(HomeDeliveryController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
