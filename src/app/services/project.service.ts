import { Injectable } from '@angular/core';
import { addDoc, collection, deleteDoc, doc, onSnapshot, orderBy, query, updateDoc } from 'firebase/firestore';
import { Observable, shareReplay } from 'rxjs';
import { firestore } from '../firebase.config';
import { Project, ProjectPayload } from '../models/project.model';

@Injectable({ providedIn: 'root' })
export class ProjectService {
  private readonly collectionRef = collection(firestore, 'projects');
  private readonly projects$ = new Observable<Project[]>((subscriber) => {
    const projectsQuery = query(this.collectionRef, orderBy('name'));

    return onSnapshot(
      projectsQuery,
      (snapshot) => {
        subscriber.next(
          snapshot.docs.map((documentSnapshot) => ({
            id: documentSnapshot.id,
            ...(documentSnapshot.data() as ProjectPayload)
          }))
        );
      },
      (error) => subscriber.error(error)
    );
  }).pipe(shareReplay({ bufferSize: 1, refCount: true }));

  getProjects(): Observable<Project[]> {
    return this.projects$;
  }

  async createProject(payload: ProjectPayload): Promise<void> {
    await addDoc(this.collectionRef, payload);
  }

  async updateProject(id: string, payload: ProjectPayload): Promise<void> {
    await updateDoc(doc(this.collectionRef, id), payload);
  }

  async deleteProject(id: string): Promise<void> {
    await deleteDoc(doc(this.collectionRef, id));
  }
}
