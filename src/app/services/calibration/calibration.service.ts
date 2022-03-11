import { Injectable } from '@angular/core';
import { Results } from '@mediapipe/holistic';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class CalibrationService {

  pose$?: Observable<Results>
  constructor(private store: Store<{pose: Results}>) {
    this.pose$ = store.select('pose')
    this.pose$.subscribe((results) => {
      this.handlePose(results)
    })
  }

  handlePose(results: Results) {
    console.log(results)
  }
}
