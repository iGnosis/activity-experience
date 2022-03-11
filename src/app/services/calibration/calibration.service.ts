import { Injectable } from '@angular/core';
import { Results } from '@mediapipe/holistic';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { calibration } from 'src/app/store/actions/calibration.actions';

@Injectable({
  providedIn: 'root'
})
export class CalibrationService {

  pose$?: Observable<Results>
  constructor(private store: Store<{pose: Results, calibration: any}>) {
    this.pose$ = store.select('pose')
    this.pose$.subscribe((results) => {
      this.handlePose(results)
    })
  }

  handlePose(results:any) {
    // Can have multiple configurations.
    let numHandsVisible = 0
    results.pose.leftHandLandmarks? numHandsVisible += 1: null 
    results.pose.rightHandLandmarks? numHandsVisible += 1: null 

    console.log(numHandsVisible);
    
    switch(numHandsVisible) {
      case 0:
        this.store.dispatch(calibration.error({pose: results.pose, reason: 'Cannot see hands'}))
        break;
      case 1:
        this.store.dispatch(calibration.warning({pose: results.pose, reason: 'Can only see one hand'}))
        break;
      case 2: 
        this.store.dispatch(calibration.success({pose: results.pose, reason: 'All well'}))
        break;
    }
  }
}
