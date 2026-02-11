import { BadRequestException, Injectable } from "@nestjs/common";
import { GoogleMapsService } from "../google-maps-leads/services/google-maps.service";
import { BatchesService } from "../batches/batches.service";
import { ImportOptionsDto } from "./import-options.dto";

@Injectable()
export class ScrapersService {
  constructor(
    private readonly googleMapsService: GoogleMapsService,
    private readonly googleSearchService: BatchesService,
    //private readonly crmContactsService: CrmContactsService,
  ) {}

  async getScrapers() {
    return [
      { id: "google_maps", name: "Google Maps" },
      { id: "google_search", name: "Google Search" },
    ];
  }

  async getBatches(source: string) {
    if (source === "google_maps") {
      const batches = await this.googleMapsService.getNameBatch();
      console.log(batches);

      return batches;
    }

    if (source === "google_search") {
      return this.googleSearchService.getNameBatches();
    }

    throw new BadRequestException("Unknown scraper source");
  }

  async importBatch(
    source: string,
    batchId: string,
    options: ImportOptionsDto,
  ) {
    let leads;

    if (source === "google_maps") {
      leads = await this.googleMapsService.getNamesAndPhonesByBatch(batchId);
    }

    if (source === "google_search") {
      leads = await this.googleSearchService.getNamesAndPhonesByBatch(batchId);
    }

    //await this.crmContactsService.insertFromLeads(leads);

    if (options.deleteSource) {
      await this.deleteSourceData(source, batchId);
    }

    return leads;
  }

  private async deleteSourceData(source: string, batchId: string) {
    if (source === "google_maps") {
      //return this.googleMapsService.deleteBatchLeads(batchId);
    }
    if (source === "google_search") {
      return this.googleSearchService.deleteBatch(batchId);
    }
  }
}
