import { Injectable } from '@angular/core';
import { NormalizedLandmark, NormalizedLandmarkList, Results } from '@mediapipe/pose';
import { Subject, Subscription } from 'rxjs';
import { CalibrationScene } from 'src/app/scenes/calibration/calibration.scene';
import { CalibrationBox, CalibrationMode, CalibrationStatusType } from 'src/app/types/pointmotion';
import { PoseModelAdapter } from '../pose-model-adapter/pose-model-adapter.service';
import { GameLifecycleService } from '../game-lifecycle/game-lifecycle.service';
import { GameLifeCycleStages } from 'src/app/types/enum';
@Injectable({
  providedIn: 'root',
})
export class CalibrationService {
  private status: CalibrationStatusType = 'error';
  isEnabled = false;
  result = new Subject<CalibrationStatusType>();
  subscription: Subscription;
  subscriptionReCalibration: Subscription;
  mode: CalibrationMode = 'full';
  private visibilityThreshold = 0.7;
  _reCalibrationCount = 0;
  reCalibrationCount = new Subject<number>();
  private canvasWidth: number;
  private canvasHeight: number;
  private calibrationBox: {
    x: number;
    y: number;
    width: number;
    height: number;
  };

  constructor(
    private calibrationScene: CalibrationScene,
    private poseModelAdapter: PoseModelAdapter,
    private gameLifeCycleService: GameLifecycleService,
  ) {}

  enable(autoSwitchMode = true) {
    this.isEnabled = true;

    this._setupCanvasDimensions();
    this._setupCalibrationSubscription(autoSwitchMode);
    this.gameLifeCycleService.enterStage(GameLifeCycleStages.CALIBRATION);
  }

  _setupCanvasDimensions() {
    if (this.calibrationScene.game) {
      this.canvasWidth = this.calibrationScene.game.canvas.width;
      this.canvasHeight = this.calibrationScene.game.canvas.height;
      this.calibrationBox = this.calibrationScene.calibrationBox;
    }

    console.log('calibrationBox::', this.calibrationBox);
  }

  _setupCalibrationSubscription(autoSwitchMode: boolean) {
    this.subscription = this.poseModelAdapter.getPose().subscribe((results) => {
      const newStatus = this._calibrateBody(
        results,
        this.mode,
        this.canvasWidth,
        this.canvasHeight,
        this.calibrationBox,
      );

      if (!newStatus) return;

      if (newStatus.status === 'success') {
        this.gameLifeCycleService.resetStage(GameLifeCycleStages.CALIBRATION);
      }

      if (newStatus.status !== this.status) {
        this.calibrationScene.destroyGraphics();

        this.result.next(newStatus.status);

        this.calibrationScene.drawCalibrationBox(newStatus.status);
        this.gameLifeCycleService.enterStage(GameLifeCycleStages.CALIBRATION);

        if (autoSwitchMode) {
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
    game.scene.start('calibration');
  }

  _isPointWithinCalibrationBox(x: number, y: number, calibrationBox: CalibrationBox): boolean {
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
    calibrationBox: CalibrationBox,
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

    // Refer: https://mediapipe.dev/images/mobile/pose_tracking_full_body_landmarks.png
    const { bodyPoints, invisiblePoints } = this._getBodyPoints(poseLandmarkArray);

    if (invisiblePoints.length > 0) {
      return { status: 'error' };
    }

    const { calibratedPoints, unCalibratedPoints } = this._getCalibrationPoints(
      bodyPoints,
      poseLandmarkArray,
      canvasWidth,
      canvasHeight,
      mode,
      calibrationBox,
    );

    const shouldStartGame = bodyPoints.length === calibratedPoints.length;
    if (shouldStartGame) {
      return { status: 'success' };
    }

    if (this.mode === 'full') {
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

    // don't care, as long as points are visible.
    return { status: 'success' };
  }

  _getBodyPoints(poseLandmarkArray: NormalizedLandmarkList): {
    bodyPoints: number[];
    invisiblePoints: NormalizedLandmark[];
  } {
    let bodyPoints: number[] = [];

    if (this.mode === 'full') {
      if (this.poseModelAdapter.getModel() === 'mediapipe') {
        // only consider point 9 to 28 (https://stackoverflow.com/a/28247338/1234007)
        bodyPoints = Array.from({ length: 20 }, (v, k) => k + 9);
      } else if (this.poseModelAdapter.getModel() === 'posenet') {
        // consider all landmarks points that are compatible with Posenet.
        bodyPoints = [0, 2, 5, 7, 8, 11, 12, 13, 14, 15, 16, 23, 24, 25, 26, 27, 28];
      }
    } else if (this.mode === 'fast') {
      // only the key body points must be visible.
      bodyPoints = [12, 11, 24, 23, 26, 25];
    }

    const keyBodyPoints = bodyPoints.map((point) => poseLandmarkArray[point]);
    const invisiblePoints = keyBodyPoints.filter((point) => {
      if (
        !point ||
        !point.visibility ||
        (point.visibility < this.visibilityThreshold &&
          !this._isPointWithinCalibrationBox(
            point.x * this.canvasWidth,
            point.y * this.canvasHeight,
            this.calibrationBox,
          ))
      ) {
        return true;
      }
      return false;
    });

    return {
      bodyPoints,
      invisiblePoints,
    };
  }

  _getCalibrationPoints(
    bodyPoints: number[],
    poseLandmarkArray: NormalizedLandmarkList,
    canvasWidth: number,
    canvasHeight: number,
    mode: CalibrationMode,
    calibrationBox: CalibrationBox,
  ): {
    calibratedPoints: number[];
    unCalibratedPoints: number[];
  } {
    const unCalibratedPoints: number[] = [];
    const calibratedPoints: number[] = [];

    bodyPoints.forEach((point) => {
      const xPoint = poseLandmarkArray[point].x * canvasWidth;
      const yPoint = poseLandmarkArray[point].y * canvasHeight;

      // it's okay if user isn't within the box.
      if (mode === 'fast') {
        calibratedPoints.push(point);
      }

      // user must be within the box.
      if (mode === 'full') {
        if (!this._isPointWithinCalibrationBox(xPoint, yPoint, calibrationBox)) {
          // console.log(`point ${point} is out of calibration box`);
          unCalibratedPoints.push(point);
        } else {
          calibratedPoints.push(point);
        }
      }
    });

    return {
      calibratedPoints,
      unCalibratedPoints,
    };
  }
}
