import { Injectable } from '@angular/core';
import { Results } from '@mediapipe/pose';
import { Subscription } from 'rxjs';
import { PoseService } from '../services/pose/pose.service';

export enum TextureKeys {
  Circle = 'circle_shape',
  Triangle = 'triangle_shape',
  Rectangle = 'rectangle_shape',
  Wrong = 'wrong_shape',
}

export type Shape = 'circle' | 'triangle' | 'rectangle' | 'wrong';
export type Origin =
  | 'bottom-right'
  | 'bottom-left'
  | 'bottom-center'
  | 'left-center'
  | 'right-center'
  | 'top-left'
  | 'top-right';

@Injectable({
  providedIn: 'root',
})
export class SoundExplorerScene extends Phaser.Scene {
  private poseSubscription: Subscription;
  private enabled = false;
  private results: Results;
  private enableLeft = false;
  private enableRight = false;
  private collisions = false;
  constructor(private poseService: PoseService) {
    super({ key: 'soundSlicer' });
  }

  preload() {
    // preloading design assets
    this.load.image({
      key: TextureKeys.Circle,
      url: 'assets/images/sound-slicer/Circle shape.png',
    });

    this.load.image({
      key: TextureKeys.Rectangle,
      url: 'assets/images/sound-slicer/Rectangle shape.png',
    });

    this.load.image({
      key: TextureKeys.Triangle,
      url: 'assets/images/sound-slicer/Triangle shape.png',
    });

    this.load.image({
      key: TextureKeys.Wrong,
      url: 'assets/images/sound-slicer/Wrong shape.png',
    });
  }

  enable(): void {
    this.enabled = true;
    this.poseSubscription = this.poseService.getPose().subscribe((results) => {
      this.results = results;
      // do something with the pose Results..
      if (this.leftHand) {
        this.leftHand.destroy(true);
      }
      if (this.rightHand) {
        this.rightHand.destroy(true);
      }
      this.drawHands(results);
    });
  }

  create() {}

  override update(time: number, delta: number): void {}

  circle: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody;
  triangle: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody;
  rectangle: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody;
  wrong: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody;

  /**
   * @param angle angle to be converted to phaser angle.
   * @returns The angle in degrees calculated in clockwise positive direction (down = 90 degrees positive, right = 0 degrees positive, up = 90 degrees negative, left = +/- 180 deg)
   */
  toPhaserAngle(angle: number): number {
    return Phaser.Math.Angle.WrapDegrees(Phaser.Math.DegToRad(angle));
  }

  showShapes(shapes: Shape[], origin: Origin, angle: number, velocity: number) {
    const shapeScale = 0.04;

    const phaserAngle = this.toPhaserAngle(angle);

    console.log('normalize = ', phaserAngle);
    console.log('normalize = ', Phaser.Math.RadToDeg(phaserAngle));

    console.log(
      'shapes::',
      shapes,
      ' Origin::',
      origin,
      ' angle::',
      angle,
      ' velocity::',
      velocity,
    );

    const velocityX = velocity * Math.cos(angle);
    const velocityY = -velocity * Math.sin(angle);
    for (let i = 0; i < shapes.length; i++) {
      // const [originX, originY] = this.getOrigin(origin);
      // const [originX, originY] = [
      //   Phaser.Math.Between(40, 100),
      //   Phaser.Math.Between(this.game.canvas.height - 60, this.game.canvas.height - 20),
      // ];
      const [originX, originY] = [400, 400];
      console.log('OriginPoint::x:', originX);
      console.log('OriginPoint::y:', originY);

      // this.physics.add.group({
      //   dragX: 60,
      //   dragY: 60,

      // });

      switch (shapes[i]) {
        case 'circle':
          this.circle = this.physics.add
            .sprite(originX, originY, TextureKeys.Circle)
            .setScale(shapeScale);
          // this.circle.setVelocity(velocityX, velocityY);
          this.physics.velocityFromRotation(phaserAngle, velocity, this.circle.body.velocity);
          break;
        case 'triangle':
          this.triangle = this.physics.add
            .sprite(originX, originY, TextureKeys.Triangle)
            .setScale(shapeScale);
          this.physics.velocityFromRotation(
            Phaser.Math.DegToRad(angle),
            velocity,
            this.triangle.body.velocity,
          );
          break;
        case 'rectangle':
          this.rectangle = this.physics.add
            .sprite(originX, originY, TextureKeys.Rectangle)
            .setScale(shapeScale);
          this.physics.velocityFromRotation(
            Phaser.Math.DegToRad(angle),
            velocity,
            this.rectangle.body.velocity,
          );
          break;
        case 'wrong':
          this.wrong = this.physics.add
            .sprite(originX, originY, TextureKeys.Wrong)
            .setScale(shapeScale);
          this.physics.velocityFromRotation(
            Phaser.Math.DegToRad(angle),
            velocity,
            this.wrong.body.velocity,
          );
          break;
      }
    }
  }

  leftHand: Phaser.GameObjects.Arc;
  rightHand: Phaser.GameObjects.Arc;
  drawHands(results: Results) {
    const { width, height } = this.game.canvas;
    if (!results || !Array.isArray(results.poseLandmarks)) {
      return;
    }
    if (results.poseLandmarks[15] && results.poseLandmarks[19] && this.enableLeft) {
      const leftWrist = results.poseLandmarks[15];
      const leftIndex = results.poseLandmarks[19];
      const [x, y] = this.midPoint(leftWrist.x, leftWrist.y, leftIndex.x, leftIndex.y);

      this.leftHand = this.add.circle(width - x * width, y * height, 25, 0xffffff, 0.5);
    }
    if (results.poseLandmarks[16] && results.poseLandmarks[20] && this.enableRight) {
      const rightWrist = results.poseLandmarks[16];
      const rightIndex = results.poseLandmarks[20];
      const [x, y] = this.midPoint(rightWrist.x, rightWrist.y, rightIndex.x, rightIndex.y);

      // this.rightHand = this.add.arc(width - x * width, y * height, 25, 0, 360, false, 0xffffff, 0.5);
      this.rightHand = this.add.circle(width - x * width, y * height, 25, 0xffffff, 0.5);
    }
  }

  midPoint(x1: number, y1: number, x2: number, y2: number) {
    return [(x1 + x2) / 2, (y1 + y2) / 2];
  }

  getOrigin(type: Origin): [number, number] {
    const { width, height } = this.game.canvas;
    switch (type) {
      case 'bottom-right':
        return [width, height];
      case 'bottom-left':
        return [0, Phaser.Math.Between((75 / 100) * height, height)];
      case 'bottom-center':
        return [width / 2, height];
      case 'top-left':
        return [0, 0];
      case 'top-right':
        return [width, 0];
      case 'left-center':
        return [0, height / 2];
      case 'right-center':
        return [width, height / 2];
    }
  }

  disable(): void {
    this.enabled = false;
    this.poseSubscription.unsubscribe();
  }

  /**
   * @param value default `true`.
   */
  enableLeftHand(value = true) {
    this.enableLeft = value;
  }
  /**
   * @param value default `true`.
   */
  enableRightHand(value = true) {
    this.enableRight = value;
  }

  /**
   * @param value default `true`.
   */
  enableCollisionDetection(value = true) {
    this.collisions = value;
  }

  waitForCollisionOrTimeout(timeout?: number) {
    return new Promise((resolve) => {
      const startTime = new Date().getTime();
      const interval = setInterval(() => {
        // if timeout...
        if (timeout && new Date().getTime() - startTime > timeout) {
          resolve({
            result: undefined,
          });
          clearInterval(interval);
        }
        // if collision detected...
      }, 300);
    });
  }

  configureMusic(): void {}
  playSuccessMusic(): void {}
  playFailureMusic(): void {}
}
