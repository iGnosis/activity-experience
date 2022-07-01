import { Injectable } from '@angular/core';
import { Results } from '@mediapipe/holistic';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { calibration } from 'src/app/store/actions/calibration.actions';
import { AnalyticsService } from '../analytics/analytics.service';
import { CareplanService } from '../careplan/careplan.service';
import { v4 } from 'uuid';
import { CalibrationScene } from 'src/app/scenes/calibration/calibration.scene';
import { NormalizedLandmarkList } from 'src/app/types/pointmotion';
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
  isEnabled = false;
  // configuration = 'hands' // full-body, upper-body, lower-body, hands

  constructor(
    private store: Store<{
      calibration: any;
    }>,
    private careplanService: CareplanService,
    private analyticsService: AnalyticsService,
    private calibrationScene: CalibrationScene,
  ) {}

  enable() {
    this.isEnabled = true;
  }

  disable() {
    this.isEnabled = false;
  }

  handlePose(results: { pose: Results }): { status: string } | undefined {
    if (!results) return;

    return this.calibrateFullBody(results);
    // // Can have multiple configurations.
    // switch (this.careplanService.getCarePlan().calibration.type) {
    //   case 'full_body':

    //   case 'hands':
    //     // return this.calibrateHands(results);
    //     break
    // }
  }

  calibrateHands(results: any) {
    let numHandsVisible = 0;
    results.pose.leftHandLandmarks ? (numHandsVisible += 1) : null;
    results.pose.rightHandLandmarks ? (numHandsVisible += 1) : null;

    switch (numHandsVisible) {
      case 0:
        this.store.dispatch(calibration.error({ pose: results.pose, reason: 'Cannot see hands' }));
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
        });

        // this.eventService.dispatchEventName('calibration.service', 'error', {message: 'Cannot see hands'})
        break;
      case 1:
        this.store.dispatch(
          calibration.warning({
            pose: results.pose,
            reason: 'Can only see one hand',
          }),
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
        this.store.dispatch(calibration.success({ pose: results.pose, reason: 'All well' }));
        // this.store.dispatch(guide.hide())
        // this.eventService.dispatchEventName('calibration', 'success', {message: 'Can only see one hand'})
        break;
    }
  }

  calibrationBoxContains(x: number, y: number, point?: number): boolean {
    return (
      this.calibrationScene.calibrationBox.x < x &&
      x < this.calibrationScene.calibrationBox.x + this.calibrationScene.calibrationBox.width &&
      this.calibrationScene.calibrationBox.y < y &&
      y < this.calibrationScene.calibrationBox.y + this.calibrationScene.calibrationBox.height
    );
  }

  calibrateFullBody(results: { pose: Results }) {
    if (!this.isEnabled) return;

    const poseLandmarkArray = results.pose.poseLandmarks;

    const points = [12, 11, 24, 23, 26, 25];

    if (!Array.isArray(poseLandmarkArray)) {
      return {
        status: 'error',
      };
    } else {
      // const points = [11, 13, 17, 21, 25, 31, 32, 26, 12, 14, 18, 22, 2, 5];
      const unCalibratedPoints: number[] = [];
      const calibratedPoints: number[] = [];
      const pointsPoseLandmarkArray: NormalizedLandmarkList = [];
      points.forEach((point) => {
        pointsPoseLandmarkArray.push(poseLandmarkArray[point]);
        if (
          (poseLandmarkArray[point].visibility as number) < 0.7 ||
          !this.calibrationBoxContains(
            poseLandmarkArray[point].x * this.calibrationScene.sys.game.canvas.width,
            poseLandmarkArray[point].y * this.calibrationScene.sys.game.canvas.height,
          )
        ) {
          console.log(`point ${point} is out of calibration box`);
          unCalibratedPoints.push(point);
        } else {
          calibratedPoints.push(point);
        }
      });

      // if all the points are in the calibration box, we will send the status as success!
      if (points.length === calibratedPoints.length) {
        return {
          status: 'success',
        };
      } else {
        // See if there is any point we can't see
        const invisiblePoint = pointsPoseLandmarkArray.find((x) => {
          if (!x.visibility || x.visibility < 0.6) {
            return true;
          } else {
            return false;
          }
        });

        // if there is any point we can't see, we will send the status as error!
        if (invisiblePoint) {
          this.calibrationScene.drawCalibrationPoints(
            results.pose,
            calibratedPoints,
            unCalibratedPoints,
          );
          return {
            status: 'error',
          };
        }
        // else if all the points are visible, we will send the status as warning!
        else {
          this.calibrationScene.drawCalibrationPoints(
            results.pose,
            calibratedPoints,
            unCalibratedPoints,
          );
          return {
            status: 'warning',
          };
        }
      }
    }
  }

  dispatchCalibration() {}
}
