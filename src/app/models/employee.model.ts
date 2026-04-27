export interface Employee {
  id: string;
  name: string;
  email: string;
}

export type EmployeePayload = Omit<Employee, 'id'>;
