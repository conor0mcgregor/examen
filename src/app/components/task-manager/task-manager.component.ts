import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { combineLatest, map } from 'rxjs';
import { TaskDetails } from '../../models/task-details.model';
import { EmployeeService } from '../../services/employee.service';
import { ProjectService } from '../../services/project.service';
import { TaskService } from '../../services/task.service';

@Component({
  selector: 'app-task-manager',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './task-manager.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TaskManagerComponent {
  private readonly formBuilder = inject(FormBuilder);
  private readonly taskService = inject(TaskService);
  private readonly employeeService = inject(EmployeeService);
  private readonly projectService = inject(ProjectService);

  readonly employees$ = this.employeeService.getEmployees();
  readonly projects$ = this.projectService.getProjects();
  readonly taskDetails$ = this.taskService.getTaskDetails();
  readonly canCreateTasks$ = combineLatest([this.employees$, this.projects$]).pipe(
    map(([employees, projects]) => employees.length > 0 && projects.length > 0)
  );
  readonly isSaving = signal(false);
  readonly errorMessage = signal('');
  readonly editingId = signal<string | null>(null);
  readonly submitLabel = computed(() => (this.editingId() ? 'Update' : 'Add'));
  readonly titleLabel = computed(() => (this.editingId() ? 'Edit task' : 'Add task'));

  readonly form = this.formBuilder.nonNullable.group({
    employeeId: ['', Validators.required],
    projectId: ['', Validators.required],
    taskName: ['', Validators.required]
  });

  hasError(controlName: 'employeeId' | 'projectId' | 'taskName'): boolean {
    const control = this.form.controls[controlName];
    return control.invalid && (control.touched || control.dirty);
  }

  startEdit(task: TaskDetails): void {
    this.editingId.set(task.id);
    this.errorMessage.set('');
    this.form.setValue({
      employeeId: task.employeeId,
      projectId: task.projectId,
      taskName: task.taskName
    });
  }

  clearForm(): void {
    this.editingId.set(null);
    this.errorMessage.set('');
    this.form.reset({
      employeeId: '',
      projectId: '',
      taskName: ''
    });
    this.form.markAsPristine();
    this.form.markAsUntouched();
  }

  async submit(): Promise<void> {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.isSaving.set(true);
    this.errorMessage.set('');

    try {
      const payload = this.form.getRawValue();
      const editingId = this.editingId();

      if (editingId) {
        await this.taskService.updateTask(editingId, payload);
      } else {
        await this.taskService.createTask(payload);
      }

      this.clearForm();
    } catch {
      this.errorMessage.set('The task could not be saved. Please try again.');
    } finally {
      this.isSaving.set(false);
    }
  }

  async deleteTask(task: TaskDetails): Promise<void> {
    const confirmed = window.confirm(`Delete task "${task.taskName}"?`);

    if (!confirmed) {
      return;
    }

    this.isSaving.set(true);
    this.errorMessage.set('');

    try {
      await this.taskService.deleteTask(task.id);

      if (this.editingId() === task.id) {
        this.clearForm();
      }
    } catch {
      this.errorMessage.set('The task could not be deleted. Please try again.');
    } finally {
      this.isSaving.set(false);
    }
  }

  trackById(_: number, task: TaskDetails): string {
    return task.id;
  }
}
