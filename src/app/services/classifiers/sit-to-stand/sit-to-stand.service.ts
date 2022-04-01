import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import { guide } from 'src/app/store/actions/guide.actions';
import { Results } from 'src/app/types/pointmotion';
import { CareplanService } from '../../careplan/careplan.service';
import { EventsService } from '../../events/events.service';

@Injectable({
  providedIn: 'root'
})
export class SitToStandService {
  
  private isEnabled = false
  private distanceThreshold = 0.25
  
  constructor(private eventService: EventsService, private careplan: CareplanService, private store: Store<{calibration: any}>,) {
    this.eventService.addContext('sit2stand.service', this)
    
    // Try pulling in the distance threshold from the careplan config. Fallback to 0.25
    try {
      this.distanceThreshold = this.careplan.getCarePlan().config['sit2stand'].pointDistanceThreshold
    } catch (err) {
      console.error(err)
      this.distanceThreshold = 0.25
    }

    // Listen to the poses... From calibration service
    this.store.select(state => state.calibration).subscribe((data: any) => {
      if(data && data.pose) {
        this.classify(data.pose)
      }
    })
  }
  
  classify(pose: Results) {
    if (this.isEnabled) {
      let postLandmarkArray = pose.poseLandmarks
      let leftHip = postLandmarkArray[23]
      let leftKnee = postLandmarkArray[25]
      let rightHip = postLandmarkArray[24]
      let rightKnee = postLandmarkArray[26]
      
      // console.log(leftHip, rightHip)
      // console.log(rightKnee, rightKnee)
      
      // make sure that body parts are visible
      if ((leftHip.visibility && leftHip.visibility < 0.6) ||
      (leftKnee.visibility && leftKnee.visibility < 0.6) ||
      (rightHip.visibility && rightHip.visibility < 0.6) ||
      (rightKnee.visibility && rightKnee.visibility < 0.6)) {
        return
      }
      
      let distanceBetweenLeftHipAndKnee = this._calcDist(leftHip.x, leftHip.y, leftKnee.x, leftKnee.y)
      console.log(`Dist left Hip - Knee: ${distanceBetweenLeftHipAndKnee}`)
      let distanceBetweenRightHipAndKnee = this._calcDist(rightHip.x, rightHip.y, rightKnee.x, rightKnee.y)
      console.log(`Dist right Hip - Knee: ${distanceBetweenRightHipAndKnee}`)
      
      // 0.25 is distance threshold. We may need to fine tune this parameter.
      
      
      if (distanceBetweenLeftHipAndKnee < this.distanceThreshold && distanceBetweenRightHipAndKnee < this.distanceThreshold) {
        // this.store.dispatch(calibration.success({ pose: results.pose, reason: 'Sitting down' }))
        console.log('sitting down');
        this.store.dispatch(guide.sendMessages({title: 'Sitting down', text: 'Sitting', timeout: 2000}))
      } else {
        // this.store.dispatch(calibration.warning({ pose: results.pose, reason: 'Standing up' }))
        this.store.dispatch(guide.sendMessages({title: 'Standing', text: 'Standing', timeout: 2000}))
      }
      
    }
  }
  
  action_enable() {
    this.isEnabled = true
  }
  
  action_disable() {
    this.isEnabled = false
  }
  
  _calcDist(x1: number, y1: number, x2: number, y2: number): any {
    // distance = √[(x2 – x1)^2 + (y2 – y1)^2]
    const distance = Math.sqrt(Math.pow((x2 - x1), 2) + Math.pow((y2 - y1), 2))
    return distance
  }
  
}
