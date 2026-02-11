export interface CreateAssistantDto {
  user_id: string;
  name: string;
  description: string;
  status: string;
  type: string;
  use_case: string;
  welcome_message: string;
  funciones?: any[];
}
