import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Employee } from '../../models/employee.model';
import { EmployeeService } from '../../services/employee.service';

@Component({
  selector: 'app-employee-manager',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './employee-manager.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class EmployeeManagerComponent {
  private readonly formBuilder = inject(FormBuilder);
  private readonly employeeService = inject(EmployeeService);

  readonly employees$ = this.employeeService.getEmployees();
  readonly isSaving = signal(false);
  readonly errorMessage = signal('');
  readonly editingId = signal<string | null>(null);
  readonly submitLabel = computed(() => (this.editingId() ? 'Update' : 'Add'));
  readonly titleLabel = computed(() => (this.editingId() ? 'Edit employee' : 'Add employee'));

  readonly form = this.formBuilder.nonNullable.group({
    name: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]]
  });

  hasError(controlName: 'name' | 'email'): boolean {
    const control = this.form.controls[controlName];
    return control.invalid && (control.touched || control.dirty);
  }

  startEdit(employee: Employee): void {
    this.editingId.set(employee.id);
    this.errorMessage.set('');
    this.form.setValue({
      name: employee.name,
      email: employee.email
    });
  }

  clearForm(): void {
    this.editingId.set(null);
    this.errorMessage.set('');
    this.form.reset({
      name: '',
      email: ''
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
        await this.employeeService.updateEmployee(editingId, payload);
      } else {
        await this.employeeService.createEmployee(payload);
      }

      this.clearForm();
    } catch {
      this.errorMessage.set('The employee could not be saved. Please try again.');
    } finally {
      this.isSaving.set(false);
    }
  }

  async deleteEmployee(employee: Employee): Promise<void> {
    const confirmed = window.confirm(`Delete employee "${employee.name}"?`);

    if (!confirmed) {
      return;
    }

    this.isSaving.set(true);
    this.errorMessage.set('');

    try {
      await this.employeeService.deleteEmployee(employee.id);

      if (this.editingId() === employee.id) {
        this.clearForm();
      }
    } catch {
      this.errorMessage.set('The employee could not be deleted. Remove related tasks first if needed.');
    } finally {
      this.isSaving.set(false);
    }
  }

  trackById(_: number, employee: Employee): string {
    return employee.id;
  }
}
