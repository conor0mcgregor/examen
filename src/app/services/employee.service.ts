import { Injectable } from '@angular/core';
import { addDoc, collection, deleteDoc, doc, onSnapshot, orderBy, query, updateDoc } from 'firebase/firestore';
import { Observable, shareReplay } from 'rxjs';
import { firestore } from '../firebase.config';
import { Employee, EmployeePayload } from '../models/employee.model';

@Injectable({ providedIn: 'root' })
export class EmployeeService {
  private readonly collectionRef = collection(firestore, 'employees');
  private readonly employees$ = new Observable<Employee[]>((subscriber) => {
    const employeesQuery = query(this.collectionRef, orderBy('name'));

    return onSnapshot(
      employeesQuery,
      (snapshot) => {
        subscriber.next(
          snapshot.docs.map((documentSnapshot) => ({
            id: documentSnapshot.id,
            ...(documentSnapshot.data() as EmployeePayload)
          }))
        );
      },
      (error) => subscriber.error(error)
    );
  }).pipe(shareReplay({ bufferSize: 1, refCount: true }));

  getEmployees(): Observable<Employee[]> {
    return this.employees$;
  }

  async createEmployee(payload: EmployeePayload): Promise<void> {
    await addDoc(this.collectionRef, payload);
  }

  async updateEmployee(id: string, payload: EmployeePayload): Promise<void> {
    await updateDoc(doc(this.collectionRef, id), payload);
  }

  async deleteEmployee(id: string): Promise<void> {
    await deleteDoc(doc(this.collectionRef, id));
  }
}
