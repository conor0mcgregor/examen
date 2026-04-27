export interface Task {
  id: string;
  employeeId: string;
  projectId: string;
  taskName: string;
}

export type TaskPayload = Omit<Task, 'id'>;
