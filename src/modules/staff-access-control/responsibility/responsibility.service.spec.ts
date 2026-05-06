import { Test, TestingModule } from '@nestjs/testing';
import { ResponsibilityService } from './responsibility.service';

describe('ResponsibilityService', () => {
  let service: ResponsibilityService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ResponsibilityService],
    }).compile();

    service = module.get<ResponsibilityService>(ResponsibilityService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
