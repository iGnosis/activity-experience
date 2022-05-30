import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class CalibrationScene extends Phaser.Scene {
  invalid = false;
  webcam: any;
  frame$?: Observable<any>;
  calibration$?: Observable<any>;
  texture?: string;
  showCalibration = true;
  checkImage?: Phaser.GameObjects.Image;
  wrongImage?: Phaser.GameObjects.Image;

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

  constructor(private store: Store<{ calibration: any }>) {
    super({ key: 'calibration' });
    console.log('in calibration scene');
  }

  preload() {
    this.load.svg('check', 'assets/images/circle-check-solid.svg');
    this.load.svg('wrong', 'assets/images/circle-xmark-solid.svg');
  }

  create() {
    console.log('draw box');
    const { width, height } = this.game.canvas;
    console.log(`Width ${width}, Height ${height}`);
    this.checkImage = new Phaser.GameObjects.Image(this, width / 2, height / 2, 'check').setScale(
      0.2,
    );
    this.wrongImage = new Phaser.GameObjects.Image(this, width / 2, height / 2, 'wrong').setScale(
      0.2,
    );

    this.createCalibrationBox(40, 98);
    // this.calibration$ = this.store.select((state) => state.calibration);
    // this.calibration$.subscribe((result) => {
    //   if (result && result.status) {
    //     switch (result.status) {
    //       case 'error':
    //         // this.createCalibrationBox(40, 90);
    //         this.drawCalibrationBox('error');
    //         break;
    //       case 'warning':
    //         // this.createCalibrationBox(40, 90);
    //         this.drawCalibrationBox('warning');
    //         break;
    //       case 'success':
    //         // this.createCalibrationBox(40, 90);
    //         this.drawCalibrationBox('success');
    //         break;
    //     }
    //   }
    // });
  }

  /**
   *
   * @param percentWidth percentage of the bounding-box width
   * @param percentHeight percentage of the bounding-box height
   */
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

    this.calibrationRectangle.right = this.add.rectangle(
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

  drawCalibrationBox(type: string) {
    if (!this.sys.game || !this.showCalibration) return;

    const { width, height } = this.sys.game.canvas;
    console.log(`${width} X ${height}`);

    this.add.existing(this.calibrationRectangle.left as Phaser.GameObjects.Rectangle);
    this.add.existing(this.calibrationRectangle.right as Phaser.GameObjects.Rectangle);
    this.add.existing(this.calibrationRectangle.top as Phaser.GameObjects.Rectangle);
    this.add.existing(this.calibrationRectangle.bottom as Phaser.GameObjects.Rectangle);
    this.add.existing(this.calibrationRectangle.center as Phaser.GameObjects.Rectangle);

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
