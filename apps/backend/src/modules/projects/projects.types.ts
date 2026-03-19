export interface CreateProjectInput {
  name: string;
  ownerId: string;
}

export interface ProjectOutput {
  id: string;
  name: string;
  createdAt: Date;
  role: 'owner' | 'EDITOR' | 'VIEWER';
}

export interface ProjectDetailOutput {
  id: string;
  name: string;
  createdAt: Date;
  userRole: 'owner' | 'EDITOR' | 'VIEWER';
}
