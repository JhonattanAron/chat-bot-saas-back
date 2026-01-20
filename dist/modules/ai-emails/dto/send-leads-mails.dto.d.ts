export declare class LeadDto {
    userId: string;
    empresa: string;
    descripcion: string;
    emails: string[];
    razon: string;
    nivel_interes: string;
    batch: string;
}
export declare class SendLeadsMailsDto {
    leads: LeadDto[];
}
