import { Test, TestingModule } from '@nestjs/testing';
import { PromotersController } from './promoters.controller';

describe('PromotersController', () => {
  let controller: PromotersController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PromotersController],
    }).compile();

    controller = module.get<PromotersController>(PromotersController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
