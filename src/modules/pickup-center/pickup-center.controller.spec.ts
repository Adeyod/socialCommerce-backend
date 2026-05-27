import { Test, TestingModule } from '@nestjs/testing';
import { PickupCenterController } from './pickup-center.controller';

describe('PickupCenterController', () => {
  let controller: PickupCenterController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PickupCenterController],
    }).compile();

    controller = module.get<PickupCenterController>(PickupCenterController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
