import { Test, TestingModule } from '@nestjs/testing';
import { RiderInviteService } from './rider-invite.service';

describe('RiderInviteService', () => {
  let service: RiderInviteService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [RiderInviteService],
    }).compile();

    service = module.get<RiderInviteService>(RiderInviteService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
