import { Injectable } from '@angular/core';
import { Results } from '@mediapipe/holistic';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { CalibrationService } from 'src/app/services/calibration/calibration.service';
import { SessionRow } from 'src/app/types/pointmotion';
import { CalibrationScene } from '../calibration/calibration.scene';

@Injectable({
  providedIn: 'root',
})
export class ExperimentScene extends Phaser.Scene {
  observables$: {
    pose: Observable<{ pose: Results }>;
    session: Observable<SessionRow | undefined>;
  };
  calibrationStatus: 'success' | 'error' | 'warning' = 'error';

  constructor(
    private store: Store<{ pose: any }>,
    private calibrationScene: CalibrationScene,
    private calibrationService: CalibrationService,
  ) {
    super({ key: 'experiment' });
  }

  preload() {}
  create() {
    this.scene.add;
  }
  override update(time: number, delta: number): void {}

  start() {
    this.startExperimentScene();
    this.subscribe();
    this.calibrationScene.drawCalibrationBox('error');
    this.calibrationService.enable();
  }

  startCalibrationScene() {
    if (this.game?.scene.isActive('experiment')) {
      this.game.scene.stop('experiment');
      console.log('sit2stand is active. turning off');
      this.game?.scene.start('calibration');
      console.log('start calibration');
    } else {
      console.log('calibration is already active');
    }
  }

  startExperimentScene() {
    if (this.scene) {
      if (this.game.scene.isActive('calibration')) {
        this.game.scene.stop('calibration');
        this.game.scene.start('experiment');
      }
    }
  }

  subscribe() {
    this.observables$ = this.observables$ || {};
    this.observables$.pose = this.store.select((state) => state.pose);
    this.observables$.pose.subscribe((results: { pose: Results }) => {
      if (results) {
        console.log(results);
        this.handlePose(results);
      }
    });
  }

  handlePose(results: { pose: Results }) {
    const calibrationResult = this.calibrationService.handlePose(results);
    if (calibrationResult && this.calibrationStatus !== calibrationResult.status) {
      console.log(calibrationResult);
      this.handleCalibrationResult(calibrationResult.status);
      this.calibrationStatus = calibrationResult.status;
    }
  }

  handleCalibrationResult(calibrationResult: 'success' | 'error' | 'warning') {
    console.log('calibration Result', calibrationResult);
    switch (calibrationResult) {
      case 'warning':
        this.handleCalibrationWarning('warning');
        break;
      case 'success':
        this.handleCalibrationSuccess('success');
        break;
      case 'error':
        this.handleCalibrationError('error');
        break;
      default:
    }
  }
  handleCalibrationWarning(warning: string) {
    this.calibrationScene.drawCalibrationBox(warning);
  }
  handleCalibrationSuccess(success: string) {
    this.startExperimentScene();
  }
  handleCalibrationError(error: string) {
    this.calibrationScene.drawCalibrationBox(error);
    this.startCalibrationScene();
  }
}
