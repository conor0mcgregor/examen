export interface Project {
  id: string;
  name: string;
  description: string;
}

export type ProjectPayload = Omit<Project, 'id'>;
