import { Injectable } from '@angular/core';
import { Results } from '@mediapipe/holistic';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { calibration } from 'src/app/store/actions/calibration.actions';
import { AnalyticsService } from '../analytics/analytics.service';
import { CareplanService } from '../careplan/careplan.service';
import { EventsService } from '../events/events.service';
import { v4 } from 'uuid';
import { environment } from 'src/environments/environment';
import { GuideActionShowMessagesDTO } from 'src/app/types/pointmotion';
import { guide } from 'src/app/store/actions/guide.actions';
@Injectable({
  providedIn: 'root'
})
export class CalibrationService {

  pose$?: Observable<any>
  eventDispatcher: any
  calibration$?: Observable<string>
  isCalibrating = false
  taskId = v4()
  status = 'error'
  // configuration = 'hands' // full-body, upper-body, lower-body, hands
  constructor(
    private store: Store<{pose: Results, calibration: any, guide: GuideActionShowMessagesDTO}>,
    private eventService: EventsService,
    private careplanService: CareplanService,
    private analyticsService: AnalyticsService,
    ) {
    this.pose$ = store.select('pose')
    this.pose$.subscribe((results) => {
      this.handlePose(results)
    })

    setTimeout(() => {
      this.eventDispatcher = this.eventService.addContext('calibration.service', this)
      this.calibration$ = this.store.select((state) => state.calibration.status)
      this.calibration$.subscribe(status => {
        this.eventDispatcher.dispatchEventName(status)


        if(!environment.analytics.calibration) {
          return
        }

        // calibration score
        let score = 0 // 0 means error
        switch(status) {
          case 'warning': 
            score = 0.5; break;
          case 'success':
            score = 1; break;
          default:
            score = 0
        }
        // Also send it through analytics
        const activity = analyticsService.getActivityId('Calibration')
        this.analyticsService.sendEvent({
          activity,
          attempt_id: v4(),
          event_type: 'calibrationChanged',
          task_id: this.taskId,
          score,
          task_name: status
        })
      })
    }, 500)
    
  }

  handlePose(results: {pose: Results}) {
    if (!results) return
    
    // Can have multiple configurations.
    switch(this.careplanService.getCarePlan().calibration.type) {
      case 'full_body':
        this.calibrateFullBody(results)
        break
      case 'hands':
        this.calibrateHands(results)
        break 
    }
  }

  calibrateHands(results: any) {
    let numHandsVisible = 0
    results.pose.leftHandLandmarks? numHandsVisible += 1: null 
    results.pose.rightHandLandmarks? numHandsVisible += 1: null 

    switch(numHandsVisible) {
      case 0:
        this.store.dispatch(calibration.error({pose: results.pose, reason: 'Cannot see hands'}))
        this.store.dispatch(guide.sendMessages({title: 'Calibration', text: 'Show your hands!', timeout: 20000}))
        // this.eventService.dispatchEventName('calibration.service', 'error', {message: 'Cannot see hands'})
        break;
      case 1:
        this.store.dispatch(calibration.warning({pose: results.pose, reason: 'Can only see one hand'}))
        this.store.dispatch(guide.sendMessages({title: 'Calibration', text: 'Both hands....', timeout: 20000}))
        // this.eventService.dispatchEventName('calibration.service', 'warning', {message: 'Can only see one hand'})
        break;
      case 2: 
        this.store.dispatch(calibration.success({pose: results.pose, reason: 'All well'}))
        // this.store.dispatch(guide.hide())
        // this.eventService.dispatchEventName('calibration', 'success', {message: 'Can only see one hand'})
        break;
    }
  }

  calibrateFullBody(results: {pose: Results}) {
    // console.log('calibrateFullBody', results);
    
    const sendError = () => {
      this.store.dispatch(calibration.error({pose: results.pose, reason: 'Cannot see required points'}))
      this.store.dispatch(guide.sendMessages({title: 'Calibration', text: 'Move into the frame, please', timeout: 20000}))
    }

    const sendSuccess = () => {
      this.store.dispatch(calibration.success({pose: results.pose, reason: 'All well'}))
    }

    let poseLandmarkArray = results.pose.poseLandmarks

    if(!Array.isArray(poseLandmarkArray)) {
      
      return sendError()
    } else {
      let leftHip = poseLandmarkArray[23]
      let leftKnee = poseLandmarkArray[25]
      let rightHip = poseLandmarkArray[24]
      let rightKnee = poseLandmarkArray[26]
      if ((leftHip.visibility && leftHip.visibility < 0.6) ||
        (leftKnee.visibility && leftKnee.visibility < 0.6) ||
        (rightHip.visibility && rightHip.visibility < 0.6) ||
        (rightKnee.visibility && rightKnee.visibility < 0.6)) {
          sendError()
      } else {
        sendSuccess()
      }
    }

    
    
    // console.log(leftHip, rightHip)
    // console.log(rightKnee, rightKnee)
    
    // make sure that body parts are visible
    
  }

  dispatchCalibration() {

  }


}
