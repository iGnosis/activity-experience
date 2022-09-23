import { Injectable } from '@angular/core';
import { Results } from '@mediapipe/pose';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { Scene } from 'phaser';
import { CalibrationStatusType } from 'src/app/types/pointmotion';

@Injectable({
  providedIn: 'root',
})
export class CalibrationScene extends Scene {
  invalid = false;
  webcam: any;
  frame$?: Observable<any>;
  calibration$?: Observable<any>;
  texture?: string;
  showCalibration = true;
  checkImage?: Phaser.GameObjects.Image;
  wrongImage?: Phaser.GameObjects.Image;
  graphics?: Phaser.GameObjects.Graphics = undefined;
  calibrationStatus = 'success';

  //calibration box dimensions
  calibrationBox: {
    x: number;
    y: number;
    width: number;
    height: number;
  } = { x: 0, y: 0, width: 0, height: 0 };

  calibrationRectangle: {
    top?: Phaser.GameObjects.Rectangle;
    right?: Phaser.GameObjects.Rectangle;
    bottom?: Phaser.GameObjects.Rectangle;
    left?: Phaser.GameObjects.Rectangle;
    center?: Phaser.GameObjects.Rectangle;
  } = {};

  constructor() {
    super({ key: 'calibration' });
  }

  preload() {
    this.load.svg('check', 'assets/images/circle-check-solid.svg');
    this.load.svg('wrong', 'assets/images/circle-xmark-solid.svg');
  }

  create() {
    console.log('create: in calibration scene');
    const { width, height } = this.game.canvas;
    console.log(`Width ${width}, Height ${height}`);
    this.checkImage = new Phaser.GameObjects.Image(this, width / 2, height / 2, 'check').setScale(
      0.2,
    );
    this.wrongImage = new Phaser.GameObjects.Image(this, width / 2, height / 2, 'wrong').setScale(
      0.2,
    );

    this.createCalibrationBox(40, 98);

    // TODO: Put this in Calibration Service.
    // This is just a workaround (can't get it to work from Calibration Service)...
    setTimeout(() => {
      this.drawCalibrationBox('error');
    }, 0);
  }

  createCalibrationBox(percentageWidth: number, percentageHeight: number) {
    const { width, height } = this.game.canvas;
    console.log(`Width ${width}, Height ${height}`);
    this.calibrationBox.width = (width * percentageWidth) / 100;
    this.calibrationBox.height = (height * percentageHeight) / 100;

    this.calibrationRectangle.left = new Phaser.GameObjects.Rectangle(
      this,
      (width - this.calibrationBox.width) / 4,
      height / 2,
      (width - this.calibrationBox.width) / 2,
      height,
    );

    this.calibrationRectangle.right = new Phaser.GameObjects.Rectangle(
      this,
      width - (width - this.calibrationBox.width) / 4,
      height / 2,
      (width - this.calibrationBox.width) / 2,
      height,
    );

    this.calibrationRectangle.top = new Phaser.GameObjects.Rectangle(
      this,
      width / 2,
      (height - this.calibrationBox.height) / 4,
      this.calibrationBox.width,
      (height - this.calibrationBox.height) / 2,
    );

    this.calibrationRectangle.bottom = new Phaser.GameObjects.Rectangle(
      this,
      width / 2,
      height - (height - this.calibrationBox.height) / 4,
      this.calibrationBox.width,
      (height - this.calibrationBox.height) / 2,
    );

    this.calibrationBox.x = (width - this.calibrationBox.width) / 2;
    this.calibrationBox.y = (height - this.calibrationBox.height) / 2;

    this.calibrationRectangle.center = new Phaser.GameObjects.Rectangle(
      this,
      (width - this.calibrationBox.width) / 2,
      (height - this.calibrationBox.height) / 2,
      this.calibrationBox.width,
      this.calibrationBox.height,
    ).setOrigin(0, 0);
  }

  override update(time: number, delta: number): void {}

  destroyGraphics() {
    if (this.graphics) {
      this.graphics.destroy();
    }
  }

  drawCalibrationPoints(
    poseResults: Results,
    calibratedPoints: number[],
    unCalibratedPoints: number[],
    canvasWidth: number,
    canvasHeight: number,
  ) {
    // console.log(poseResults);
    // we can clear the exisiting pose and calibration points here, currently doing it in holistic.service!
    // this.destroyGraphics();
    this.graphics = this.add.graphics({ fillStyle: { color: 0xffffff, alpha: 1 } });
    this.graphics.lineStyle(5, 0xffffff);

    // to draw calibration pose lines
    // this.drawCalibrationPose(poseResults, this.graphics);

    // to draw calibrated points
    for (const point of calibratedPoints) {
      this.graphics.fillStyle(0xffffff, 1);
      this.graphics.fillCircleShape(
        new Phaser.Geom.Circle(
          canvasWidth - poseResults.poseLandmarks[point].x * canvasWidth,
          poseResults.poseLandmarks[point].y * canvasHeight,
          12,
        ),
      );
      this.graphics.fillStyle(0x00bd3e, 1);
      this.graphics.fillCircleShape(
        new Phaser.Geom.Circle(
          canvasWidth - poseResults.poseLandmarks[point].x * canvasWidth,
          poseResults.poseLandmarks[point].y * canvasHeight,
          10,
        ),
      );
    }

    // to draw uncalibrated points
    for (const point of unCalibratedPoints) {
      this.graphics.fillStyle(0xffffff, 1);
      this.graphics.fillCircleShape(
        new Phaser.Geom.Circle(
          canvasWidth - poseResults.poseLandmarks[point].x * canvasWidth,
          poseResults.poseLandmarks[point].y * canvasHeight,
          12,
        ),
      );
      this.graphics.fillStyle(0xf73636, 1);
      this.graphics.fillCircleShape(
        new Phaser.Geom.Circle(
          canvasWidth - poseResults.poseLandmarks[point].x * canvasWidth,
          poseResults.poseLandmarks[point].y * canvasHeight,
          10,
        ),
      );
    }
  }

  drawCalibrationPose(poseResults: Results, graphics: Phaser.GameObjects.Graphics) {
    const { width, height } = this.game.canvas;

    const leftShoulder = poseResults.poseLandmarks[11];
    const rightShoulder = poseResults.poseLandmarks[12];
    const rightElbow = poseResults.poseLandmarks[14];
    const leftElbow = poseResults.poseLandmarks[13];
    const rightHip = poseResults.poseLandmarks[24];
    const leftHip = poseResults.poseLandmarks[23];
    const rightKnee = poseResults.poseLandmarks[26];
    const leftKnee = poseResults.poseLandmarks[25];
    const rightAnkle = poseResults.poseLandmarks[28];
    const leftAnkle = poseResults.poseLandmarks[27];
    const rightWrist = poseResults.poseLandmarks[16];
    const leftWrist = poseResults.poseLandmarks[15];
    const leftIndex = poseResults.poseLandmarks[19];
    const rightIndex = poseResults.poseLandmarks[20];
    const rightFootIndex = poseResults.poseLandmarks[32];
    const rightHeel = poseResults.poseLandmarks[30];
    const leftFootIndex = poseResults.poseLandmarks[31];
    const leftHeel = poseResults.poseLandmarks[29];

    // foot connections
    graphics.lineBetween(
      width - rightAnkle.x * width,
      rightAnkle.y * height,
      width - rightFootIndex.x * width,
      rightFootIndex.y * height,
    );
    graphics.lineBetween(
      width - rightAnkle.x * width,
      rightAnkle.y * height,
      width - rightHeel.x * width,
      rightHeel.y * height,
    );
    graphics.lineBetween(
      width - rightFootIndex.x * width,
      rightFootIndex.y * height,
      width - rightHeel.x * width,
      rightHeel.y * height,
    );

    graphics.lineBetween(
      width - leftAnkle.x * width,
      leftAnkle.y * height,
      width - leftFootIndex.x * width,
      leftFootIndex.y * height,
    );
    graphics.lineBetween(
      width - leftAnkle.x * width,
      leftAnkle.y * height,
      width - leftHeel.x * width,
      leftHeel.y * height,
    );
    graphics.lineBetween(
      width - leftFootIndex.x * width,
      leftFootIndex.y * height,
      width - leftHeel.x * width,
      leftHeel.y * height,
    );

    // connection between left and right shoulders
    if (leftShoulder && rightShoulder) {
      graphics.lineBetween(
        width - leftShoulder.x * width,
        leftShoulder.y * height,
        width - rightShoulder.x * width,
        rightShoulder.y * height,
      );
    }

    // connection between shoulders and elbows
    graphics.lineBetween(
      width - rightShoulder.x * width,
      rightShoulder.y * height,
      width - rightElbow.x * width,
      rightElbow.y * height,
    );

    graphics.lineBetween(
      width - leftShoulder.x * width,
      leftShoulder.y * height,
      width - leftElbow.x * width,
      leftElbow.y * height,
    );

    // connection between elbows and wrists
    graphics.lineBetween(
      width - rightElbow.x * width,
      rightElbow.y * height,
      width - rightWrist.x * width,
      rightWrist.y * height,
    );

    graphics.lineBetween(
      width - leftElbow.x * width,
      leftElbow.y * height,
      width - leftWrist.x * width,
      leftWrist.y * height,
    );

    // connection between wrists to index fingers
    graphics.lineBetween(
      width - rightWrist.x * width,
      rightWrist.y * height,
      width - rightIndex.x * width,
      rightIndex.y * height,
    );

    graphics.lineBetween(
      width - leftWrist.x * width,
      leftWrist.y * height,
      width - leftIndex.x * width,
      leftIndex.y * height,
    );

    // connection between shoulders and hip
    graphics.lineBetween(
      width - rightShoulder.x * width,
      rightShoulder.y * height,
      width - rightHip.x * width,
      rightHip.y * height,
    );

    graphics.lineBetween(
      width - leftShoulder.x * width,
      leftShoulder.y * height,
      width - leftHip.x * width,
      leftHip.y * height,
    );

    // connection between lefthip and righthip
    graphics.lineBetween(
      width - rightHip.x * width,
      rightHip.y * height,
      width - leftHip.x * width,
      leftHip.y * height,
    );

    // connection between hip and knee.
    graphics.lineBetween(
      width - rightHip.x * width,
      rightHip.y * height,
      width - rightKnee.x * width,
      rightKnee.y * height,
    );

    graphics.lineBetween(
      width - leftHip.x * width,
      leftHip.y * height,
      width - leftKnee.x * width,
      leftKnee.y * height,
    );

    // connection between knee and ankle
    graphics.lineBetween(
      width - rightKnee.x * width,
      rightKnee.y * height,
      width - rightAnkle.x * width,
      rightAnkle.y * height,
    );
    graphics.lineBetween(
      width - leftKnee.x * width,
      leftKnee.y * height,
      width - leftAnkle.x * width,
      leftAnkle.y * height,
    );
  }

  drawCalibrationBox(type: CalibrationStatusType) {
    if (!this.game || !this.showCalibration) return;

    const { width, height } = this.sys.game.canvas;

    this.add.existing(this.calibrationRectangle.left as Phaser.GameObjects.Rectangle);
    this.add.existing(this.calibrationRectangle.right as Phaser.GameObjects.Rectangle);
    this.add.existing(this.calibrationRectangle.top as Phaser.GameObjects.Rectangle);
    this.add.existing(this.calibrationRectangle.bottom as Phaser.GameObjects.Rectangle);
    this.add.existing(this.calibrationRectangle.center as Phaser.GameObjects.Rectangle);

    console.log(`drawCalibrationBox: ${width} X ${height}`);
    let fillColor = 0x000066;

    switch (type) {
      case 'error':
        fillColor = 0x000066;
        break;
      case 'warning':
        fillColor = 0xffff00;
        break;
      case 'success':
        fillColor = 0x00bd3e;
    }

    ['top', 'right', 'bottom', 'left'].forEach((rect) => {
      this.calibrationRectangle[rect as keyof typeof this.calibrationRectangle]!.setAlpha(1);
      this.calibrationRectangle[rect as keyof typeof this.calibrationRectangle]!.setFillStyle(
        fillColor,
        0.3,
      );
    });

    if (this.calibrationRectangle && this.calibrationRectangle.center) {
      if (type == 'success') {
        this.calibrationRectangle.center.setStrokeStyle(4, 0xffffff);
        if (this.checkImage) {
          this.add.existing(this.checkImage);
        }
        this.tweens.add({
          targets: [
            this.calibrationRectangle.top,
            this.calibrationRectangle.right,
            this.calibrationRectangle.bottom,
            this.calibrationRectangle.left,
            this.calibrationRectangle.center,
          ],
          alpha: 0.9,
          duration: 1000,
          onComplete: () => {
            // this.eventsService.dispatchEventName('calibration.scene', 'completed', {})
            // Move to whatever activity was going on...
            this.scene.start('sit2stand');
          },
        });
      } else {
        this.tweens.getAllTweens().forEach((tween) => {
          this.tweens.remove(tween);
        });

        Object.keys(this.calibrationRectangle).forEach((key) => {
          this.calibrationRectangle[key as keyof typeof this.calibrationRectangle]!.setAlpha(1);
        });

        this.calibrationRectangle.center.setStrokeStyle(4, 0xf73636);
        if (this.wrongImage) {
          this.add.existing(this.wrongImage);
        }
      }
    }
  }
}
