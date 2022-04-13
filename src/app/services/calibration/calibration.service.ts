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

    setTimeout(() => {
      this.calibration$ = this.store.select(
        (state) => state.calibration.status
      );
      this.calibration$.subscribe((status) => {
        if (!environment.analytics.calibration) {
          return;
        }

        // calibration score
        let score = 0; // 0 means error
        switch (status) {
          case 'warning':
            score = 0.5;
            break;
          case 'success':
            score = 1;
            break;
          default:
            score = 0;
        }

        const activity = analyticsService.getActivityId('Calibration');

        // renew attemptId
        this.attemptId = v4();
        this.taskId = v4();

        // start a task since it'd a retry
        this.analyticsService.sendEvent({
          activity,
          attempt_id: this.attemptId,
          event_type: 'taskStarted',
          task_id: this.taskId,
          score: 0,
          task_name: 'calibration',
        });

        this.analyticsService.sendEvent({
          activity,
          attempt_id: this.attemptId,
          event_type: 'taskReacted',
          task_id: this.taskId,
          score: 0,
          task_name: 'calibration',
        });

        this.analyticsService.sendEvent({
          activity,
          attempt_id: this.attemptId,
          event_type: 'taskEnded',
          task_id: this.taskId,
          score,
          task_name: 'calibration',
        });
      });
    }, 500);
  }

  handlePose(results: { pose: Results }) {
    if (!results) return;

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
        this.store.dispatch(
          guide.sendMessages({
            title: 'Calibration',
            text: 'Show your hands!',
            timeout: 20000,
          })
        );
        // this.eventService.dispatchEventName('calibration.service', 'error', {message: 'Cannot see hands'})
        break;
      case 1:
        this.store.dispatch(
          calibration.warning({
            pose: results.pose,
            reason: 'Can only see one hand',
          })
        );
        this.store.dispatch(
          guide.sendMessages({
            title: 'Calibration',
            text: 'Both hands....',
            timeout: 20000,
          })
        );
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
    // console.log(`point ${point}`);
    // console.log(
    //   this.calibrationScene.calibrationBox.x,
    //   x,
    //   this.calibrationScene.calibrationBox.x +
    //     this.calibrationScene.calibrationBox.width
    // );
    // console.log(
    //   this.calibrationScene.calibrationBox.y,
    //   y,
    //   this.calibrationScene.calibrationBox.y +
    //     this.calibrationScene.calibrationBox.height
    // );
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
    console.log('calibrateFullBody', results);

    const sendError = () => {
      this.store.dispatch(
        calibration.error({
          pose: results.pose,
          reason: 'Cannot see required points',
        })
      );
      this.store.dispatch(
        guide.sendMessages({
          title: 'Calibration',
          text: 'Move into the frame, please',
          timeout: 20000,
        })
      );
    };

    const sendSuccess = () => {
      this.store.dispatch(
        calibration.success({ pose: results.pose, reason: 'All well' })
      );
    };

    let poseLandmarkArray = results.pose.poseLandmarks;

    console.log(
      `width ${this.calibrationScene.sys.game.canvas.width} Height ${this.calibrationScene.sys.game.canvas.height}`
    );

    if (!Array.isArray(poseLandmarkArray)) {
      return sendError();
    } else {
      // TODO debug 0,5,2 points
      const points = [11, 13, 17, 21, 25, 31, 32, 26, 12, 14, 18, 22];

      let success: boolean = true;
      for (const i of points) {
        // console.log(i)
        // console.log(poseLandmarkArray[i].visibility as number);
        // console.log(poseLandmarkArray[i].x);
        // console.log(poseLandmarkArray[i].y);
        if (
          !((poseLandmarkArray[i].visibility as number) > 0.7 &&
          this.calibrationBoxContains(
            poseLandmarkArray[i].x *
              this.calibrationScene.sys.game.canvas.width,
            poseLandmarkArray[i].y *
              this.calibrationScene.sys.game.canvas.height,
            i as number
          ))
        ) {
       
          success = false;
          console.log(`point ${i} is out of calibration box`);
          sendError();
          break;
        }
        if (success) {
          console.log('calibration success');
          sendSuccess();
        }
      }
    }

    // make sure that body parts are visible
  }

  dispatchCalibration() {}
}
