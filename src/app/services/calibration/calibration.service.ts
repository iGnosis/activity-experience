import { Injectable } from '@angular/core';
import { Results } from '@mediapipe/holistic';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { calibration } from 'src/app/store/actions/calibration.actions';
import { AnalyticsService } from '../analytics/analytics.service';
import { CareplanService } from '../careplan/careplan.service';
import { v4 } from 'uuid';
import { environment } from 'src/environments/environment';
import { GuideActionShowMessagesDTO } from 'src/app/types/pointmotion';
import { guide } from 'src/app/store/actions/guide.actions';
import { CalibrationScene } from 'src/app/scenes/calibration/calibration.scene';
@Injectable({
  providedIn: 'root',
})
export class CalibrationService {
  pose$?: Observable<any>;
  // eventDispatcher: any;
  calibration$?: Observable<string>;
  isCalibrating = false;
  taskId = v4();
  attemptId = v4();
  previousAttemptId = this.attemptId;
  status = 'error';
  activityId: string;
  // configuration = 'hands' // full-body, upper-body, lower-body, hands

  constructor(
    private store: Store<{
      pose: Results;
      calibration: any;
      guide: GuideActionShowMessagesDTO;
    }>,
    private careplanService: CareplanService,
    private analyticsService: AnalyticsService,
    private calibrationScene: CalibrationScene
  ) {
    this.pose$ = store.select('pose');
    this.pose$.subscribe((results) => {
      this.handlePose(results);
    });

    this.activityId = this.analyticsService.getActivityId('Calibration');

    // activityStarted 'calibration'

    // this.analyticsService.sendActivityEvent({
    //   activity: this.activityId,
    //   event_type: 'activityStarted',
    // });
  }

  handlePose(results: { pose: Results }) {
    if (!results) return;

    // renew attemptId
    // this.attemptId = v4();
    // this.taskId = v4();

    // this.analyticsService.sendTaskEvent({
    //   activity: this.activityId,
    //   attempt_id: this.attemptId,
    //   event_type: 'taskStarted',
    //   task_id: this.taskId,
    //   task_name: 'calibration',
    // });

    // Can have multiple configurations.
    switch (this.careplanService.getCarePlan().calibration.type) {
      case 'full_body':
        this.calibrateFullBody(results);
        break;
      case 'hands':
        this.calibrateHands(results);
        break;
    }
  }

  calibrateHands(results: any) {
    let numHandsVisible = 0;
    results.pose.leftHandLandmarks ? (numHandsVisible += 1) : null;
    results.pose.rightHandLandmarks ? (numHandsVisible += 1) : null;

    switch (numHandsVisible) {
      case 0:
        this.store.dispatch(
          calibration.error({ pose: results.pose, reason: 'Cannot see hands' })
        );
        // this.store.dispatch(
        //   guide.sendMessages({
        //     title: 'Calibration',
        //     text: 'Show your hands!',
        //     timeout: 20000,
        //   })
        // );
        console.error({
          title: 'Calibration',
          text: 'Show your hands!',
          timeout: 20000,
        })
        
        // this.eventService.dispatchEventName('calibration.service', 'error', {message: 'Cannot see hands'})
        break;
      case 1:
        this.store.dispatch(
          calibration.warning({
            pose: results.pose,
            reason: 'Can only see one hand',
          })
        );
        console.error({
          title: 'Calibration',
          text: 'Both hands....',
          timeout: 20000,
        });
        
        // this.store.dispatch(
        //   guide.sendMessages({
        //     title: 'Calibration',
        //     text: 'Both hands....',
        //     timeout: 20000,
        //   })
        // );
        // this.eventService.dispatchEventName('calibration.service', 'warning', {message: 'Can only see one hand'})
        break;
      case 2:
        this.store.dispatch(
          calibration.success({ pose: results.pose, reason: 'All well' })
        );
        // this.store.dispatch(guide.hide())
        // this.eventService.dispatchEventName('calibration', 'success', {message: 'Can only see one hand'})
        break;
    }
  }

  calibrationBoxContains(x: number, y: number, point?: number): boolean {
    return (
      this.calibrationScene.calibrationBox.x < x &&
      x <
        this.calibrationScene.calibrationBox.x +
          this.calibrationScene.calibrationBox.width &&
      this.calibrationScene.calibrationBox.y < y &&
      y <
        this.calibrationScene.calibrationBox.y +
          this.calibrationScene.calibrationBox.height
    );
  }

  calibrateFullBody(results: { pose: Results }) {
    // console.log('calibrateFullBody', results);

    // this.analyticsService.sendTaskEvent({
    //   activity: this.activityId,
    //   attempt_id: this.attemptId,
    //   event_type: 'taskReacted',
    //   task_id: this.taskId,
    //   task_name: 'calibration',
    // });

    const sendError = () => {
      //   this.analyticsService.sendTaskEvent({
      //     activity: this.activityId,
      //     attempt_id: this.attemptId,
      //     event_type: 'taskEnded',
      //     task_id: this.taskId,
      //     score: 0,
      //     task_name: 'calibration',
      //   });

      this.store.dispatch(
        calibration.error({
          pose: results.pose,
          reason: 'Cannot see required points',
        })
      );
      console.error({
        // title: 'Calibration',
        text: 'Move into the frame, please',
        timeout: 60000,
      });
      
      // this.store.dispatch(
      //   guide.sendMessages({
      //     // title: 'Calibration',
      //     text: 'Move into the frame, please',
      //     timeout: 60000,
      //   })
      // );
    };
    const sendWarning = () => {
      this.store.dispatch(
        calibration.warning({
          pose: results.pose,
          reason: 'points not within the bound',
        })
      );
    };

    const sendSuccess = () => {
      //   this.analyticsService.sendTaskEvent({
      //     activity: this.activityId,
      //     attempt_id: this.attemptId,
      //     event_type: 'taskEnded',
      //     task_id: this.taskId,
      //     score: 1,
      //     task_name: 'calibration',
      //   });

      // activityEnded 'calibration'
      //   this.analyticsService.sendActivityEvent({
      //     activity: this.activityId,
      //     event_type: 'activityEnded',
      //   });

      this.store.dispatch(
        calibration.success({ pose: results.pose, reason: 'All well' })
      );
    };

    let poseLandmarkArray = results.pose.poseLandmarks;

    // console.log(
    //   `width ${this.calibrationScene.sys.game.canvas.width} Height ${this.calibrationScene.sys.game.canvas.height}`
    // );

    if (!Array.isArray(poseLandmarkArray)) {
      return sendError();
    } else {
        
      // adding these points to make the calibration lenient
      const points = [12, 11, 24, 23, 26, 25];
      //   const points = [11, 13, 17, 21, 25, 31, 32, 26, 12, 14, 18, 22, 2, 5];
      const isCalibrationSuccess = points.every((point) => {
        if (
          (poseLandmarkArray[point].visibility as number) < 0.7 ||
          !this.calibrationBoxContains(
            poseLandmarkArray[point].x *
              this.calibrationScene.sys.game.canvas.width,
            poseLandmarkArray[point].y *
              this.calibrationScene.sys.game.canvas.height,
            point as number
          )
        ) {
          console.log(`point ${point} is out of calibration box`);
          return false;
        }
        return true;
      });

      if (isCalibrationSuccess) {
        // console.log(`Calibration Successful`);
        sendSuccess();
      } else {
        // See if there is any point we can't see
        const invisiblePoint = poseLandmarkArray.find(x => {
          if(!x.visibility || x.visibility < 0.7) {
            return true
          } else {
            return false
          }
        })

        if(invisiblePoint) {
          sendError();
        } else {
          console.log('partially uncalibrated');
          
          sendWarning()
        }
      }
    }

    // make sure that body parts are visible
  }

  dispatchCalibration() {}
}
