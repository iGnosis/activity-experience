import { Injectable } from '@angular/core';
import { Results } from '@mediapipe/holistic';
import { Observable } from 'rxjs';
import { CalibrationScene } from 'src/app/scenes/calibration/calibration.scene';
import { CalibrationMode } from 'src/app/types/pointmotion';
@Injectable({
  providedIn: 'root',
})
export class CalibrationService {
  pose$?: Observable<any>;
  calibration$?: Observable<string>;
  status = 'error';
  isEnabled = false;
  visibilityThreshold = 0.7;
  mode: CalibrationMode = 'full';

  constructor(private calibrationScene: CalibrationScene) {}

  enable() {
    this.isEnabled = true;
  }

  disable() {
    this.isEnabled = false;
  }

  setMode(mode: CalibrationMode) {
    console.log('calibrationService:setMode:mode', mode);
    this.mode = mode;
  }

  handlePose(results: { pose: Results }): { status: string } | undefined {
    if (!results) return;

    return this.calibrateFullBody(results);
  }

  _isPointWithinCalibrationBox(x: number, y: number, point?: number): boolean {
    return (
      this.calibrationScene.calibrationBox.x < x &&
      x < this.calibrationScene.calibrationBox.x + this.calibrationScene.calibrationBox.width &&
      this.calibrationScene.calibrationBox.y < y &&
      y < this.calibrationScene.calibrationBox.y + this.calibrationScene.calibrationBox.height
    );
  }

  calibrateFullBody(results: { pose: Results }) {
    if (!this.isEnabled) {
      return;
    }

    const poseLandmarkArray = results.pose.poseLandmarks;

    // just a sanity check.
    if (!Array.isArray(poseLandmarkArray)) {
      return { status: 'error' };
    }

    // Refer: https://google.github.io/mediapipe/images/mobile/pose_tracking_full_body_landmarks.png
    const unCalibratedPoints: number[] = [];
    const calibratedPoints: number[] = [];

    const points = [12, 11, 24, 23, 26, 25];
    const keyBodyPoints = points.map((point) => poseLandmarkArray[point]);

    const invisiblePoints = keyBodyPoints.filter((point) => {
      if (!point || !point.visibility || point.visibility < this.visibilityThreshold) {
        return true;
      }
      return false;
    });

    if (invisiblePoints.length > 0) {
      return { status: 'error' };
    }

    points.forEach((point) => {
      const xPoint = poseLandmarkArray[point].x * this.calibrationScene.sys.game.canvas.width;
      const yPoint = poseLandmarkArray[point].y * this.calibrationScene.sys.game.canvas.height;

      // it's okay if user isn't within the box.
      if (this.mode === 'fast') {
        calibratedPoints.push(point);
      }

      // user must be within the box.
      if (this.mode === 'full') {
        if (!this._isPointWithinCalibrationBox(xPoint, yPoint)) {
          console.log(`point ${point} is out of calibration box`);
          unCalibratedPoints.push(point);
        } else {
          calibratedPoints.push(point);
        }
      }
    });

    // allow user to play the game.
    if (points.length === calibratedPoints.length) {
      console.log(`mode: ${this.mode} - calibration success`);
      return { status: 'success' };
    }

    if (this.mode === 'full') {
      // highlight points that aren't in the box.
      this.calibrationScene.drawCalibrationPoints(
        results.pose,
        calibratedPoints,
        unCalibratedPoints,
      );
      return { status: 'warning' };
    }

    // don't care, as long as points are visible.
    return { status: 'success' };
  }
}
