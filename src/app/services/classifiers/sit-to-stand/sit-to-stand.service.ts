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
  private currentClass = 'unknown'
  private repsCompleted = 0
  private activityExplained = false

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
      const postLandmarkArray = pose.poseLandmarks
      const leftShoulder = postLandmarkArray[11]
      const leftHip = postLandmarkArray[23]
      const leftKnee = postLandmarkArray[25]

      const rightShoulder = postLandmarkArray[12]
      const rightHip = postLandmarkArray[24]
      const rightKnee = postLandmarkArray[26]

      // make sure that body parts are visible
      if ((leftShoulder.visibility && leftShoulder.visibility < 0.6) ||
      (leftHip.visibility && leftHip.visibility < 0.6) ||
      (leftKnee.visibility && leftKnee.visibility < 0.6) ||
      (rightShoulder.visibility && rightShoulder.visibility < 0.6) ||
      (rightHip.visibility && rightHip.visibility < 0.6) ||
      (rightKnee.visibility && rightKnee.visibility < 0.6)) {
        return {
          result: 'unknown'
        }
      }

      const distanceBetweenLeftShoulderAndHip = this._calcDist(leftShoulder.x, leftShoulder.y, leftHip.x, leftHip.y)
      const distanceBetweenRightShoulderAndHip = this._calcDist(rightShoulder.x, rightShoulder.y, rightHip.x, rightHip.y)
      const distanceBetweenLeftHipAndKnee = this._calcDist(leftHip.x, leftHip.y, leftKnee.x, leftKnee.y)
      const distanceBetweenRightHipAndKnee = this._calcDist(rightHip.x, rightHip.y, rightKnee.x, rightKnee.y)

      console.log(`dist - L: s-h: ${distanceBetweenLeftShoulderAndHip} h-k: ${distanceBetweenLeftHipAndKnee}`)
      console.log(`dist - R: s-h: ${distanceBetweenRightShoulderAndHip} h-k: ${distanceBetweenRightHipAndKnee}`)

      const isSittingL = distanceBetweenLeftShoulderAndHip > 1.5 * distanceBetweenLeftHipAndKnee
      const isSittingR = distanceBetweenRightShoulderAndHip > 1.5 * distanceBetweenRightHipAndKnee

      if (isSittingL && isSittingR) {
        console.log('sitting down');
        this.store.dispatch(guide.sendMessages({title: 'Sitting down', text: 'Sitting', timeout: 2000}))
        return {
          result: 'sit'
        }
      } else {
        this.store.dispatch(guide.sendMessages({title: 'Standing', text: 'Standing', timeout: 2000}))
        return {
          result: 'stand'
        }
      }

    } else {
      return {
        result: 'disabled',
      }
    }
  }

  async startActivity() {
    // Do upto 5 reps...
    if (!this.activityExplained) {
      this.store.dispatch(guide.sendMessages({text: 'Please sit when you see and EVEN number and STAND when you see ODD number', title: 'Ready?', timeout: 2000}))
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
