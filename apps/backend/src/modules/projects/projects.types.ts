export interface CreateProjectInput {
  name: string;
  ownerId: string;
}

export interface ProjectOutput {
  id: string;
  name: string;
  createdAt: Date;
}

export interface ProjectDetailOutput extends ProjectOutput {
  userRole: 'owner' | 'EDITOR' | 'VIEWER';
}
