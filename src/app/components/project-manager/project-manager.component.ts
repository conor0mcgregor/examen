import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Project } from '../../models/project.model';
import { ProjectService } from '../../services/project.service';

@Component({
  selector: 'app-project-manager',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './project-manager.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProjectManagerComponent {
  private readonly formBuilder = inject(FormBuilder);
  private readonly projectService = inject(ProjectService);

  readonly projects$ = this.projectService.getProjects();
  readonly isSaving = signal(false);
  readonly errorMessage = signal('');
  readonly editingId = signal<string | null>(null);
  readonly submitLabel = computed(() => (this.editingId() ? 'Update' : 'Add'));
  readonly titleLabel = computed(() => (this.editingId() ? 'Edit project' : 'Add project'));

  readonly form = this.formBuilder.nonNullable.group({
    name: ['', Validators.required],
    description: ['', Validators.required]
  });

  hasError(controlName: 'name' | 'description'): boolean {
    const control = this.form.controls[controlName];
    return control.invalid && (control.touched || control.dirty);
  }

  startEdit(project: Project): void {
    this.editingId.set(project.id);
    this.errorMessage.set('');
    this.form.setValue({
      name: project.name,
      description: project.description
    });
  }

  clearForm(): void {
    this.editingId.set(null);
    this.errorMessage.set('');
    this.form.reset({
      name: '',
      description: ''
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
        await this.projectService.updateProject(editingId, payload);
      } else {
        await this.projectService.createProject(payload);
      }

      this.clearForm();
    } catch {
      this.errorMessage.set('The project could not be saved. Please try again.');
    } finally {
      this.isSaving.set(false);
    }
  }

  async deleteProject(project: Project): Promise<void> {
    const confirmed = window.confirm(`Delete project "${project.name}"?`);

    if (!confirmed) {
      return;
    }

    this.isSaving.set(true);
    this.errorMessage.set('');

    try {
      await this.projectService.deleteProject(project.id);

      if (this.editingId() === project.id) {
        this.clearForm();
      }
    } catch {
      this.errorMessage.set('The project could not be deleted. Remove related tasks first if needed.');
    } finally {
      this.isSaving.set(false);
    }
  }

  trackById(_: number, project: Project): string {
    return project.id;
  }
}
