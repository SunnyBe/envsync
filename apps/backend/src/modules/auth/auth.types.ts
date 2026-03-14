export interface RegisterInput {
  email: string;
}

export interface RegisterOutput {
  id: string;
  email: string;
  apiToken: string;
}
