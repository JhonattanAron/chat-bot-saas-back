import { IsArray } from "class-validator";

export class SeedCatalogDto {
  @IsArray()
  plans: any[];

  @IsArray()
  addons: any[];
}
