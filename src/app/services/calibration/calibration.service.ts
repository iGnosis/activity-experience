import { Injectable } from '@angular/core';
import { Results } from '@mediapipe/pose';
import { debounceTime, iif, Observable, Subject, Subscription } from 'rxjs';
import { CalibrationScene } from 'src/app/scenes/calibration/calibration.scene';
import { CalibrationMode, CalibrationStatusType } from 'src/app/types/pointmotion';
import { GameService } from '../game/game.service';
import { PoseService } from '../pose/pose.service';
@Injectable({
  providedIn: 'root',
})
export class CalibrationService {
  status: CalibrationStatusType = 'error';
  isEnabled = false;
  result = new Subject<CalibrationStatusType>();
  subscription: Subscription;
  subscriptionReCalibration: Subscription;
  mode: CalibrationMode = 'full';
  visibilityThreshold = 0.7;
  _reCalibrationCount = 0;
  reCalibrationCount = new Subject<number>();
  canvasWidth: number;
  canvasHeight: number;
  calibrationBox: {
    x: number;
    y: number;
    width: number;
    height: number;
  };

  constructor(private calibrationScene: CalibrationScene, private poseService: PoseService) {
    this.result.pipe(debounceTime(2000)).subscribe((status) => {
      // this.calculateCalibrationCount(status);
    });
  }

  enable(autoSwitchMode = true) {
    this.isEnabled = true;
    // get canvas height and width from calibration scene.
    if (this.calibrationScene.game) {
      this.canvasWidth = this.calibrationScene.game.canvas.width;
      this.canvasHeight = this.calibrationScene.game.canvas.height;
      this.calibrationBox = this.calibrationScene.calibrationBox;
    }
    console.log('calibrationBox::', this.calibrationBox);
    this.subscription = this.poseService.getPose().subscribe((results) => {
      const newStatus = this._calibrateBody(
        results,
        this.mode,
        this.canvasWidth,
        this.canvasHeight,
        this.calibrationBox,
      );

      if (!newStatus) return;

      if (newStatus.status !== this.status) {
        this.calibrationScene.destroyGraphics();
        // On successful recalibration, just increment the counter.
        // if (newStatus.status === 'success') {
        //   // this._reCalibrationCount += 1;
        //   this.reCalibrationCount.next(this._reCalibrationCount);
        // } else if (newStatus.status === 'error') {
        //   // this._reCalibrationCount += 1;
        //   // this.reCalibrationCount.next(this._reCalibrationCount);
        // }
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
    this.subscriptionReCalibration = this.result.pipe(debounceTime(2000)).subscribe((status) => {
      this._reCalibrationCount += 1;
      this.reCalibrationCount.next(this._reCalibrationCount);
    });
  }

  // calculateCalibrationCount(status: CalibrationStatusType) {
  //   this._reCalibrationCount += 1;
  //   this.reCalibrationCount.next(this._reCalibrationCount);
  // }

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

  _isPointWithinCalibrationBox(
    x: number,
    y: number,
    calibrationBox: {
      x: number;
      y: number;
      width: number;
      height: number;
    },
  ): boolean {
    const isPointWithinCalibrationBox =
      calibrationBox.x < x &&
      x < calibrationBox.x + calibrationBox.width &&
      calibrationBox.y < y &&
      y < calibrationBox.y + calibrationBox.height;

    return isPointWithinCalibrationBox;
  }

  facilitateCalibration(game: Phaser.Game) {
    // TODO: Have the communication implemented here.
  }

  _calibrateBody(
    results: Results,
    mode: CalibrationMode,
    canvasWidth: number,
    canvasHeight: number,
    calibrationBox: {
      x: number;
      y: number;
      width: number;
      height: number;
    },
  ): {
    status: CalibrationStatusType;
  } {
    if (!this.isEnabled) {
      return { status: 'disabled' };
    }

    // Refer: https://google.github.io/mediapipe/images/mobile/pose_tracking_full_body_landmarks.png
    const poseLandmarkArray = results.poseLandmarks;

    // just a sanity check.
    if (!Array.isArray(poseLandmarkArray)) {
      return { status: 'error' };
    }

    if (this.mode === 'full') {
      const unCalibratedPoints: number[] = [];
      const calibratedPoints: number[] = [];
      // 32 total body points -> 0, 1, 2, 3... 32.
      const points = [...Array(33).keys()];

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
        const xPoint = poseLandmarkArray[point].x * canvasWidth;
        const yPoint = poseLandmarkArray[point].y * canvasHeight;
        if (!this._isPointWithinCalibrationBox(xPoint, yPoint, calibrationBox)) {
          // console.log(`point ${point} is out of calibration box`);
          unCalibratedPoints.push(point);
        } else {
          calibratedPoints.push(point);
        }
      });

      // allow user to play the game.
      if (points.length === calibratedPoints.length) {
        return { status: 'success' };
      }

      // to remove if calibration points are already drawn.
      this.calibrationScene.destroyGraphics();
      // highlight points that aren't in the box.
      this.calibrationScene.drawCalibrationPoints(
        results,
        calibratedPoints,
        unCalibratedPoints,
        canvasWidth,
        canvasHeight,
      );
      return { status: 'warning' };
    }

    if (this.mode === 'fast') {
      // subscribe to game changes -- get requiredBodyParts from game config.
      const requiredBodyParts = {
        ANY_SHOULDER: [11, 12], // any one of the points to be required.
        ANY_HIP: [23, 24],
        ANY_KNEE: [25, 26],
      };

      let count = 0;
      for (const [_, points] of Object.entries(requiredBodyParts)) {
        const keyBodyPoints = points.map((point) => poseLandmarkArray[point]);
        const visiblePoints = keyBodyPoints.filter((landmark) => {
          if (landmark && landmark.visibility && landmark.visibility >= this.visibilityThreshold) {
            return true;
          }
          return false;
        });

        // at least one point required to be visible.
        if (visiblePoints.length >= 1) {
          count++;
        }
      }

      if (count !== Object.keys(requiredBodyParts).length) {
        return { status: 'error' };
      }

      return { status: 'success' };
    }

    // Unknown - something went wrong.
    return { status: 'error' };
  }
}
