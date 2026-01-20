import { Test, TestingModule } from '@nestjs/testing';
import { CampaignAutomatedService } from './campaign-automated.service';

describe('CampaignAutomatedService', () => {
  let service: CampaignAutomatedService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CampaignAutomatedService],
    }).compile();

    service = module.get<CampaignAutomatedService>(CampaignAutomatedService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
