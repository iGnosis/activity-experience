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

  create() {
    const { width, height } = this.game.canvas;
    this.group = this.physics.add.group({
      collideWorldBounds: true,
    });

    this.physics.world.setBounds(0, 0, width, height, true, true, true, true);

    this.physics.world.on('worldbounds', (_body: Phaser.Physics.Arcade.Body) => {
      console.log(_body);
      _body.gameObject.destroy(true);
      console.log(this.group.getChildren().length);
    });
  }

  override update(time: number, delta: number): void {
    if (this.collisions) {
      if (this.leftHand && this.group && this.group.getChildren().length >= 1) {
        this.physics.overlap(this.leftHand, this.group, (_leftHand, _shape) => {
          console.log('collision recorded');
          console.log(_shape);
          _shape.destroy(true);
          console.log(this.group);
          console.log(this.group.getChildren().length);
        });
      }
    }
  }

  group: Phaser.Physics.Arcade.Group;
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

  // musicType: 'note' | 'harmony' | 'chord';
  showShapes(shapes: Shape[], origin: Origin, angle: number, velocity: number) {
    const shapeScale = 0.04;

    // if (shapes.length >= 2) {
    //   this.musicType = 'chord';
    // }

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

    // const velocityX = velocity * Math.cos(angle);
    // const velocityY = -velocity * Math.sin(angle);
    for (let i = 0; i < shapes.length; i++) {
      const [originX, originY] = this.getOrigin(origin);

      console.log('OriginPoint::x:', originX);
      console.log('OriginPoint::y:', originY);

      switch (shapes[i]) {
        case 'circle':
          this.circle = this.physics.add
            .sprite(originX, originY, TextureKeys.Circle)
            .setScale(shapeScale);
          this.circle.body.onWorldBounds = true;
          this.group.add(this.circle);

          this.physics.velocityFromRotation(
            Phaser.Math.DegToRad(angle),
            velocity,
            this.circle.body.velocity,
          );
          break;
        case 'triangle':
          this.triangle = this.physics.add
            .sprite(originX, originY, TextureKeys.Triangle)
            .setScale(shapeScale);
          this.triangle.body.onWorldBounds = true;
          this.group.add(this.triangle);
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
          this.rectangle.body.onWorldBounds = true;
          this.group.add(this.rectangle);
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
          this.wrong.body.onWorldBounds = true;
          this.group.add(this.wrong);
          this.physics.velocityFromRotation(
            Phaser.Math.DegToRad(angle),
            velocity,
            this.wrong.body.velocity,
          );
          break;
      }
    }

    console.log('group::children:', this.group.getChildren());
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

      this.leftHand = this.physics.add.existing(
        this.add.circle(width - x * width, y * height, 25, 0xffffff, 0.5),
      );
    }
    if (results.poseLandmarks[16] && results.poseLandmarks[20] && this.enableRight) {
      const rightWrist = results.poseLandmarks[16];
      const rightIndex = results.poseLandmarks[20];
      const [x, y] = this.midPoint(rightWrist.x, rightWrist.y, rightIndex.x, rightIndex.y);

      // this.rightHand = this.add.arc(width - x * width, y * height, 25, 0, 360, false, 0xffffff, 0.5);
      this.rightHand = this.physics.add.existing(
        this.add.circle(width - x * width, y * height, 25, 0xffffff, 0.5),
      );
    }
  }

  midPoint(x1: number, y1: number, x2: number, y2: number) {
    return [(x1 + x2) / 2, (y1 + y2) / 2];
  }

  getOrigin(type: Origin): [number, number] {
    const { width, height } = this.game.canvas;
    switch (type) {
      case 'bottom-right':
        return [
          Phaser.Math.Between((90 / 100) * width, (95 / 100) * width),
          Phaser.Math.Between((80 / 100) * height, (95 / 100) * height),
        ];
      case 'bottom-left':
        return [
          Phaser.Math.Between((5 / 100) * width, (15 / 100) * width),
          Phaser.Math.Between((80 / 100) * height, (95 / 100) * height),
        ];
      case 'bottom-center':
        return [width / 2, Phaser.Math.Between((80 / 100) * height, (95 / 100) * height)];
      case 'top-left':
        return [
          Phaser.Math.Between((5 / 100) * width, (15 / 100) * width),
          Phaser.Math.Between((5 / 100) * height, (15 / 100) * height),
        ];
      case 'top-right':
        return [
          Phaser.Math.Between((80 / 100) * width, (95 / 100) * width),
          Phaser.Math.Between((5 / 100) * height, (15 / 100) * height),
        ];
      case 'left-center':
        return [Phaser.Math.Between((5 / 100) * width, (15 / 100) * width), height / 2];
      case 'right-center':
        return [Phaser.Math.Between((80 / 100) * width, (95 / 100) * width), height / 2];
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
        if (this.group.getChildren().length === 0) {
          resolve({});
          clearInterval();
        }
      }, 300);
    });
  }

  configureMusic(): void {}
  playSuccessMusic(): void {}
  playFailureMusic(): void {}
}
