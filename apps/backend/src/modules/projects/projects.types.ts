export interface CreateProjectInput {
  name: string;
  ownerId: string;
}

export interface ProjectOutput {
  id: string;
  name: string;
  createdAt: Date;
}
