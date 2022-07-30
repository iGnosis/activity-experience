import { Injectable } from '@angular/core';
import { Results } from '@mediapipe/pose';
import { Observable, Subject, Subscription } from 'rxjs';
import { CalibrationScene } from 'src/app/scenes/calibration/calibration.scene';
import { CalibrationMode, CalibrationStatusType } from 'src/app/types/pointmotion';
import { PoseService } from '../pose/pose.service';
@Injectable({
  providedIn: 'root',
})
export class CalibrationService {
  status: CalibrationStatusType = 'error';
  isEnabled = false;
  result = new Subject<CalibrationStatusType>();
  subscription: Subscription;
  mode: CalibrationMode = 'full';
  visibilityThreshold = 0.7;
  _reCalibrationCount = 0;
  reCalibrationCount = new Subject<number>();

  constructor(private calibrationScene: CalibrationScene, private poseService: PoseService) {}

  enable(autoSwitchMode = true) {
    this.isEnabled = true;
    this.subscription = this.poseService.getPose().subscribe((results) => {
      const newStatus = this._calibrateBody(results, this.mode);

      if (!newStatus) return;

      if (newStatus.status !== this.status) {
        this.calibrationScene.destroyGraphics();
        // On successful recalibration, just increment the counter.
        if (newStatus.status === 'success') {
          this._reCalibrationCount += 1;
          this.reCalibrationCount.next(this._reCalibrationCount);
        } else if (newStatus.status === 'error') {
          this._reCalibrationCount += 1;
          this.reCalibrationCount.next(this._reCalibrationCount);
        }
        // Update all the subscribers interested in calibration status
        this.result.next(newStatus.status);

        // Draw the calibration box
        this.calibrationScene.drawCalibrationBox(newStatus.status);

        if (autoSwitchMode) {
          // Move the calibration from full to fast mode.
          this.switchMode(newStatus.status);
        }
      }
      this.status = newStatus.status;
    });
  }

  switchMode(status: CalibrationStatusType) {
    if (status === 'success') {
      console.log('switching to fast mode calibration');
      this.mode = 'fast';
    } else if (status === 'error') {
      console.log('switching to full mode calibration');
      this.mode = 'full';
    }
  }

  setMode(mode: CalibrationMode) {
    console.log('calibrationService:setMode:mode', mode);
    this.mode = mode;
  }

  disable() {
    this.isEnabled = false;
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }

  startCalibrationScene(game: Phaser.Game) {
    if (!game) {
      throw new Error('Invalid game object');
    } else {
      game.scene.start('calibration');
    }
  }

  _isPointWithinCalibrationBox(x: number, y: number, point?: number): boolean {
    const isPointWithinCalibrationBox =
      this.calibrationScene.calibrationBox.x < x &&
      x < this.calibrationScene.calibrationBox.x + this.calibrationScene.calibrationBox.width &&
      this.calibrationScene.calibrationBox.y < y &&
      y < this.calibrationScene.calibrationBox.y + this.calibrationScene.calibrationBox.height;

    return isPointWithinCalibrationBox;
  }

  facilitateCalibration(game: Phaser.Game) {
    // TODO: Have the communication implemented here.
  }

  _calibrateBody(
    results: Results,
    mode: CalibrationMode,
  ): {
    status: CalibrationStatusType;
  } {
    if (!this.isEnabled) {
      return { status: 'disabled' };
    }

    const poseLandmarkArray = results.poseLandmarks;

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
      if (mode === 'fast') {
        calibratedPoints.push(point);
      }

      // user must be within the box.
      if (mode === 'full') {
        if (!this._isPointWithinCalibrationBox(xPoint, yPoint)) {
          // console.log(`point ${point} is out of calibration box`);
          unCalibratedPoints.push(point);
        } else {
          calibratedPoints.push(point);
        }
      }
    });

    // allow user to play the game.
    if (points.length === calibratedPoints.length) {
      // console.log(`mode: ${mode} - calibration success`);
      return { status: 'success' };
    }

    if (this.mode === 'full') {
      // to remove if calibration points are already drawn.
      this.calibrationScene.destroyGraphics();
      // highlight points that aren't in the box.
      this.calibrationScene.drawCalibrationPoints(results, calibratedPoints, unCalibratedPoints);
      return { status: 'warning' };
    }

    // don't care, as long as points are visible.
    return { status: 'success' };
  }
}
