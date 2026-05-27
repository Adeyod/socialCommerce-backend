import { Test, TestingModule } from '@nestjs/testing';
import { PickupCenterService } from './pickup-center.service';

describe('PickupCenterService', () => {
  let service: PickupCenterService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PickupCenterService],
    }).compile();

    service = module.get<PickupCenterService>(PickupCenterService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
