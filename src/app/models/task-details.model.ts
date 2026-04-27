import { Task } from './task.model';

export interface TaskDetails extends Task {
  employeeName: string;
  projectName: string;
}
