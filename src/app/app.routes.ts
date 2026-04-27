import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'employees',
    pathMatch: 'full'
  },
  {
    path: 'employees',
    loadComponent: () => import('./components/employee-manager/employee-manager.component').then(c => c.EmployeeManagerComponent)
  },
  {
    path: 'projects',
    loadComponent: () => import('./components/project-manager/project-manager.component').then(c => c.ProjectManagerComponent)
  },
  {
    path: 'tasks',
    loadComponent: () => import('./components/task-manager/task-manager.component').then(c => c.TaskManagerComponent)
  },
  {
    path: '**',
    redirectTo: 'employees'
  }
];
