import { Test, TestingModule } from '@nestjs/testing';
import { RiderInviteController } from './rider-invite.controller';

describe('RiderInviteController', () => {
  let controller: RiderInviteController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [RiderInviteController],
    }).compile();

    controller = module.get<RiderInviteController>(RiderInviteController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
