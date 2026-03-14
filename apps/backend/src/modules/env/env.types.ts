export interface PushEnvInput {
  projectId: string;
  env: string;
  variables: Record<string, string>;
}

export interface PullEnvInput {
  projectId: string;
  env: string;
}

export interface PullEnvOutput {
  variables: Record<string, string>;
}
