import { Injectable } from '@angular/core';
import { Results } from '@mediapipe/pose';
import { Observable, Subject, Subscription } from 'rxjs';
import { CalibrationScene } from 'src/app/scenes/calibration/calibration.scene';
import { NormalizedLandmarkList } from 'src/app/types/pointmotion';
import { PoseService } from '../pose/pose.service';
@Injectable({
  providedIn: 'root',
})
export class CalibrationService {
  status: 'error' | 'warning' | 'success' = 'error';
  isEnabled = false;
  result = new Subject<'error' | 'warning' | 'success'>();
  subscription: Subscription;
  mode: 'full' | 'fast' = 'full';

  constructor(private calibrationScene: CalibrationScene, private poseService: PoseService) {}

  getObservable() {
    return this.result;
  }

  enable() {
    this.subscription = this.poseService.getPose().subscribe((results) => {
      // TODO when the mode=full, we want the body points to be inside the box
      // When mode=fast, we only care that the visibility of each point > 0.7
      const newStatus = this._calibrateFullBody(results);
      if (newStatus && newStatus.status !== this.status) {
        this.result.next(this.status);
      }
    });
  }

  setMode(mode: 'full' | 'fast') {
    this.mode = mode;
  }

  disable() {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }

  _calibrationBoxContains(x: number, y: number, point?: number): boolean {
    return (
      this.calibrationScene.calibrationBox.x < x &&
      x < this.calibrationScene.calibrationBox.x + this.calibrationScene.calibrationBox.width &&
      this.calibrationScene.calibrationBox.y < y &&
      y < this.calibrationScene.calibrationBox.y + this.calibrationScene.calibrationBox.height
    );
  }

  _calibrateFullBody(results: Results) {
    if (!this.isEnabled) return;

    const poseLandmarkArray = results.poseLandmarks;

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
          !this._calibrationBoxContains(
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
            results,
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
            results,
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
}
