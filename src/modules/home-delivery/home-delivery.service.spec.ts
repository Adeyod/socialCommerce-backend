import { Test, TestingModule } from '@nestjs/testing';
import { HomeDeliveryService } from './home-delivery.service';

describe('HomeDeliveryService', () => {
  let service: HomeDeliveryService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [HomeDeliveryService],
    }).compile();

    service = module.get<HomeDeliveryService>(HomeDeliveryService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
