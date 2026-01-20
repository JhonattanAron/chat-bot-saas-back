declare class FunctionParameterDto {
    name: string;
    type: string;
    required: boolean;
    description?: string;
}
declare class FunctionHeaderDto {
    key: string;
    value: string;
}
declare class FunctionAuthDto {
    type: string;
    value: string;
}
declare class FunctionApiDto {
    url: string;
    method: string;
    headers?: FunctionHeaderDto[];
    parameters?: FunctionParameterDto[];
    auth?: FunctionAuthDto;
}
declare class FunctionCredentialDto {
    name: string;
    value: string;
    description?: string;
}
declare class FunctionDto {
    name: string;
    description?: string;
    type: "api" | "custom";
    api?: FunctionApiDto;
    code?: string;
    credentials?: FunctionCredentialDto[];
}
export declare class CreateAssistantDto {
    user_id: string;
    name: string;
    description: string;
    funciones: FunctionDto[];
    status: string;
    type: string;
    use_case: string;
    welcome_message: string;
}
export {};
