export interface Project {
  id: string;
  name: string;
  ownerId: string;
  createdAt: string;
}

export interface EnvVariable {
  id: string;
  projectId: string;
  key: string;
  env: string;
  createdAt: string;
}

export type Environment = 'development' | 'staging' | 'production';
