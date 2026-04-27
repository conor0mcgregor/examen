import { Injectable, inject } from '@angular/core';
import { addDoc, collection, deleteDoc, doc, onSnapshot, orderBy, query, updateDoc } from 'firebase/firestore';
import { Observable, combineLatest, map, shareReplay } from 'rxjs';
import { firestore } from '../firebase.config';
import { TaskDetails } from '../models/task-details.model';
import { Task, TaskPayload } from '../models/task.model';
import { EmployeeService } from './employee.service';
import { ProjectService } from './project.service';

@Injectable({ providedIn: 'root' })
export class TaskService {
  private readonly employeeService = inject(EmployeeService);
  private readonly projectService = inject(ProjectService);
  private readonly collectionRef = collection(firestore, 'tasks');
  private readonly tasks$ = new Observable<Task[]>((subscriber) => {
    const tasksQuery = query(this.collectionRef, orderBy('taskName'));

    return onSnapshot(
      tasksQuery,
      (snapshot) => {
        subscriber.next(
          snapshot.docs.map((documentSnapshot) => ({
            id: documentSnapshot.id,
            ...(documentSnapshot.data() as TaskPayload)
          }))
        );
      },
      (error) => subscriber.error(error)
    );
  }).pipe(shareReplay({ bufferSize: 1, refCount: true }));

  private readonly taskDetails$ = combineLatest([
    this.tasks$,
    this.employeeService.getEmployees(),
    this.projectService.getProjects()
  ]).pipe(
    map(([tasks, employees, projects]) => {
      const employeesById = new Map(employees.map((employee) => [employee.id, employee.name]));
      const projectsById = new Map(projects.map((project) => [project.id, project.name]));

      return tasks.map((task): TaskDetails => ({
        ...task,
        employeeName: employeesById.get(task.employeeId) ?? 'Employee unavailable',
        projectName: projectsById.get(task.projectId) ?? 'Project unavailable'
      }));
    }),
    shareReplay({ bufferSize: 1, refCount: true })
  );

  getTasks(): Observable<Task[]> {
    return this.tasks$;
  }

  getTaskDetails(): Observable<TaskDetails[]> {
    return this.taskDetails$;
  }

  async createTask(payload: TaskPayload): Promise<void> {
    await addDoc(this.collectionRef, payload);
  }

  async updateTask(id: string, payload: TaskPayload): Promise<void> {
    await updateDoc(doc(this.collectionRef, id), payload);
  }

  async deleteTask(id: string): Promise<void> {
    await deleteDoc(doc(this.collectionRef, id));
  }
}
