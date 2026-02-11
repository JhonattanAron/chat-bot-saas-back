import { IsBoolean, IsOptional, IsString } from "class-validator";

export class ImportOptionsDto {
  /**
   * Elimina los datos del módulo origen luego de importar
   * (ej: google-maps, google-search)
   */
  @IsBoolean()
  @IsOptional()
  deleteSource?: boolean;

  /**
   * Segmento inicial para los contactos importados
   * (ej: potencial, cliente, lead-frio)
   */
  @IsString()
  @IsOptional()
  segment?: string;

  /**
   * Nota interna que se guardará en cada contacto
   * (ej: "Importado desde Google Maps - Restaurantes Quito")
   */
  @IsString()
  @IsOptional()
  notes?: string;
}
