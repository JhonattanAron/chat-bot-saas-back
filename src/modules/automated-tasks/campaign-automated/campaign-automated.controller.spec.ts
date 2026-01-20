import { Test, TestingModule } from '@nestjs/testing';
import { CampaignAutomatedController } from './campaign-automated.controller';

describe('CampaignAutomatedController', () => {
  let controller: CampaignAutomatedController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CampaignAutomatedController],
    }).compile();

    controller = module.get<CampaignAutomatedController>(CampaignAutomatedController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
