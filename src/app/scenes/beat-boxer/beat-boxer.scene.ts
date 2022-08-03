import { Injectable } from '@angular/core';
import { Results } from '@mediapipe/pose';
import { Subscription } from 'rxjs';
import { PoseService } from 'src/app/services/pose/pose.service';

type BagPosition = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
type BagType = 'heavy-blue' | 'heavy-red' | 'speed-blue' | 'speed-red';
type ObstacleType = 'obstacle-top' | 'obstacle-bottom';

@Injectable({
  providedIn: 'root',
})
export class BeatBoxerScene extends Phaser.Scene {
  enabled = false;
  collisions = false;
  collisionDetected?: { bagType: string; gloveColor: string; result: 'success' | 'failure' };
  subscription: Subscription;
  onCollision?: (value: {
    type: BagType | 'obstacle-top' | 'obstacle-bottom';
    result: 'success' | 'failure';
  }) => void;
  enableLeft = false;
  enableRight = false;
  results?: Results;

  blueGlove: Phaser.Types.Physics.Arcade.ImageWithStaticBody;
  redGlove: Phaser.Types.Physics.Arcade.ImageWithStaticBody;
  heavyBlue: Phaser.Types.Physics.Arcade.ImageWithStaticBody;
  heavyRed: Phaser.Types.Physics.Arcade.ImageWithStaticBody;
  speedRed: Phaser.Types.Physics.Arcade.ImageWithStaticBody;
  speedBlue: Phaser.Types.Physics.Arcade.ImageWithStaticBody;
  obstacleTop: Phaser.Types.Physics.Arcade.ImageWithStaticBody;
  obstacleBottom: Phaser.Types.Physics.Arcade.ImageWithStaticBody;

  constructor(private poseService: PoseService) {
    super({ key: 'beatBoxer' });
  }

  preload() {
    this.load.svg({
      key: 'left_hand_overlay',
      url: 'assets/images/beat-boxer/HAND_OVERLAY_LEFT.svg',
      svgConfig: {
        scale: 0.6,
      },
    });
    this.load.svg({
      key: 'right_hand_overlay',
      url: 'assets/images/beat-boxer/HAND_OVERLAY_RIGHT.svg',
      svgConfig: {
        scale: 0.6,
      },
    });
    this.load.svg({
      key: 'heavy_bag_blue',
      url: 'assets/images/beat-boxer/HEAVY_BAG_BLUE.svg',
      svgConfig: {
        scale: 1,
      },
    });
    this.load.svg({
      key: 'heavy_bag_red',
      url: 'assets/images/beat-boxer/HEAVY_BAG_RED.svg',
      svgConfig: {
        scale: 1,
      },
    });
    this.load.svg({
      key: 'speed_bag_red',
      url: 'assets/images/beat-boxer/SPEED_BAG_RED.svg',
      svgConfig: {
        scale: 0.8,
      },
    });
    this.load.svg({
      key: 'speed_bag_blue',
      url: 'assets/images/beat-boxer/SPEED_BAG_BLUE.svg',
      svgConfig: {
        scale: 0.8,
      },
    });
    this.load.svg({
      key: 'obstacle_top',
      url: 'assets/images/beat-boxer/OBSTACLE_TOP.svg',
      svgConfig: {
        scale: 1.1,
      },
    });
    this.load.svg({
      key: 'obstacle_bottom',
      url: 'assets/images/beat-boxer/OBSTACLE_BOTTOM.svg',
      svgConfig: {
        scale: 1.1,
      },
    });
  }

  enable(): void {
    this.enabled = true;
    this.poseService.getPose().subscribe((results) => {
      // this.calculateReach(results);
      this.results = results;
      if (this.blueGlove) {
        this.blueGlove.destroy(true);
      }
      if (this.redGlove) {
        this.redGlove.destroy(true);
      }
      this.drawGloves(results);
    });
  }

  calcDist(x1: number, y1: number, x2: number, y2: number): number {
    // distance = √[(x2 – x1)^2 + (y2 – y1)^2]
    const distance = Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
    return distance;
  }

  calculateReach(results: Results, position: BagPosition): { x: number; y: number } {
    const { width, height } = this.game.canvas;
    if (position === 'top-left') {
      const maxReach =
        this.calcDist(
          width - results.poseLandmarks[11].x * width,
          results.poseLandmarks[11].y * height,
          width - results.poseLandmarks[13].x * width,
          results.poseLandmarks[13].y * height,
        ) +
        this.calcDist(
          width - results.poseLandmarks[13].x * width,
          results.poseLandmarks[13].y * height,
          width - results.poseLandmarks[15].x * width,
          results.poseLandmarks[15].y * height,
        ) +
        this.calcDist(
          width - results.poseLandmarks[15].x * width,
          results.poseLandmarks[15].y * height,
          width - results.poseLandmarks[19].x * width,
          results.poseLandmarks[19].y * height,
        );
      const nosePosX = width - results.poseLandmarks[0].x * width;
      return {
        x: nosePosX - maxReach - 200,
        y: 0,
      };
    } else if (position === 'top-right') {
      const maxReach =
        this.calcDist(
          width - results.poseLandmarks[12].x * width,
          results.poseLandmarks[12].y * height,
          width - results.poseLandmarks[14].x * width,
          results.poseLandmarks[14].y * height,
        ) +
        this.calcDist(
          width - results.poseLandmarks[14].x * width,
          results.poseLandmarks[14].y * height,
          width - results.poseLandmarks[16].x * width,
          results.poseLandmarks[16].y * height,
        ) +
        this.calcDist(
          width - results.poseLandmarks[16].x * width,
          results.poseLandmarks[16].y * height,
          width - results.poseLandmarks[20].x * width,
          results.poseLandmarks[20].y * height,
        );
      const nosePosX = width - results.poseLandmarks[0].x * width;
      return {
        x: nosePosX + maxReach,
        y: 0,
      };
    }
    return {
      x: width - (30 / 100) * width,
      y: 0,
    };
  }

  create() {}

  destroyExistingBags() {
    if (this.heavyBlue) {
      this.heavyBlue.destroy(false);
    }
    if (this.speedBlue) {
      this.speedBlue.destroy(false);
    }
    if (this.heavyRed) {
      this.heavyRed.destroy(false);
    }
    if (this.speedRed) {
      this.speedRed.destroy(false);
    }
    if (this.obstacleTop) {
      this.obstacleTop.destroy(false);
    }
    if (this.obstacleBottom) {
      this.obstacleBottom.destroy(false);
    }
  }

  drawGloves(results: Results) {
    const { width, height } = this.game.canvas;
    if (!results || !Array.isArray(results.poseLandmarks)) {
      return;
    }
    if (results.poseLandmarks[15] && this.enableLeft) {
      const leftWrist = results.poseLandmarks[15];
      this.blueGlove = this.physics.add.staticImage(
        width - leftWrist.x * width,
        leftWrist.y * height,
        'left_hand_overlay',
      );
    }
    if (results.poseLandmarks[16] && this.enableRight) {
      const rightWrist = results.poseLandmarks[16];
      this.redGlove = this.physics.add.staticImage(
        width - rightWrist.x * width,
        rightWrist.y * height,
        'right_hand_overlay',
      );
    }
  }

  // TODO: customize the position based on difficulty param..
  showBag(position: BagPosition, type: BagType, difficulty: 'easy' | 'hard' = 'hard') {
    console.log(`position: ${position}, type: ${type}`);
    const { width, height } = this.game.canvas;
    let x = width - (30 / 100) * width;
    let y = 0;
    if (this.results) {
      const pos = this.calculateReach(this.results, position);
      x = pos.x;
      y = pos.y;
    }
    switch (type) {
      case 'heavy-blue':
        console.log('pos:', x, y);
        this.heavyBlue = this.physics.add.staticImage(x, y, 'heavy_bag_blue').setOrigin(0, 0.1);
        console.log('width of the bag, ', this.heavyBlue.body.right - this.heavyBlue.body.left);
        this.heavyBlue.refreshBody();
        this.animateEntry(position, this.heavyBlue);
        break;
      case 'heavy-red':
        console.log('pos:', x, y);
        this.heavyRed = this.physics.add.staticImage(x, y, 'heavy_bag_red').setOrigin(0, 0.1);
        this.heavyRed.refreshBody();
        this.animateEntry(position, this.heavyRed);
        break;
      case 'speed-red':
        this.speedRed = this.physics.add.staticImage(x, y, 'speed_bag_red').setOrigin(0, 0.2);
        this.speedRed.refreshBody();
        this.animateEntry(position, this.speedRed);
        break;
      case 'speed-blue':
        this.speedBlue = this.physics.add.staticImage(x, y, 'speed_bag_blue').setOrigin(0, 0.2);
        this.speedBlue.refreshBody();
        this.animateEntry(position, this.speedBlue);
        break;
    }
  }

  showObstacle(position: BagPosition, type: ObstacleType) {
    console.log(`position: ${position}, type: ${type}`);
    const { width, height } = this.game.canvas;
    let x = width - (30 / 100) * width;
    let y = 0;
    if (this.results) {
      const pos = this.calculateReach(this.results, position);
      x = pos.x;
      y = pos.y;
    }
    switch (type) {
      case 'obstacle-top':
        this.obstacleTop = this.physics.add.staticImage(x, y, 'obstacle_top').setOrigin(0, 0.1);
        this.obstacleTop.refreshBody();
        this.animateEntry(position, this.obstacleTop);
        break;
      case 'obstacle-bottom':
        this.obstacleBottom = this.physics.add
          .staticImage(x, y, 'obstacle_top')
          .setOrigin(0, 0)
          .setRotation(3.14159);
        this.obstacleBottom.refreshBody();
        this.animateEntry(position, this.obstacleBottom);
        break;
    }
  }

  override update(time: number, delta: number): void {
    if (this.collisions) {
      if (this.blueGlove && this.heavyBlue) {
        this.physics.overlap(this.blueGlove, this.heavyBlue, (_blueGlove, _heavyBlue) => {
          _heavyBlue.destroy();
          this.collisionDetected = {
            bagType: 'heavy-blue',
            gloveColor: 'blue',
            result: 'success',
          };
          this.onCollision &&
            this.onCollision({
              type: 'heavy-blue',
              result: 'success',
            });
        });
      }
      if (this.blueGlove && this.speedBlue) {
        this.physics.overlap(this.blueGlove, this.speedBlue, (_blueGlove, _speedBlue) => {
          _speedBlue.destroy();
          this.collisionDetected = {
            bagType: 'speed-blue',
            gloveColor: 'blue',
            result: 'success',
          };
          this.onCollision &&
            this.onCollision({
              type: 'speed-blue',
              result: 'success',
            });
        });
      }
      if (this.redGlove && this.heavyRed) {
        this.physics.overlap(this.redGlove, this.heavyRed, (_redGlove, _heavyRed) => {
          _heavyRed.destroy();
          this.collisionDetected = {
            bagType: 'speed-red',
            gloveColor: 'red',
            result: 'success',
          };
          this.onCollision &&
            this.onCollision({
              type: 'heavy-red',
              result: 'success',
            });
        });
      }
      if (this.redGlove && this.speedRed) {
        this.physics.overlap(this.redGlove, this.speedRed, (_redGlove, _speedRed) => {
          _speedRed.destroy();
          this.collisionDetected = {
            bagType: 'speed-red',
            gloveColor: 'red',
            result: 'success',
          };
          this.onCollision &&
            this.onCollision({
              type: 'speed-red',
              result: 'success',
            });
        });
      }

      if (this.redGlove && this.obstacleTop) {
        this.physics.overlap(this.redGlove, this.obstacleTop, (_redGlove, _obstacleTop) => {
          _obstacleTop.destroy();
          this.collisionDetected = {
            bagType: 'obstacle-top',
            gloveColor: 'red',
            result: 'failure',
          };
          this.onCollision &&
            this.onCollision({
              type: 'obstacle-top',
              result: 'failure',
            });
        });
      }

      if (this.blueGlove && this.obstacleTop) {
        this.physics.overlap(this.blueGlove, this.obstacleTop, (_blueGlove, _obstacleTop) => {
          _obstacleTop.destroy();
          this.collisionDetected = {
            bagType: 'obstacle-top',
            gloveColor: 'blue',
            result: 'failure',
          };
          this.onCollision &&
            this.onCollision({
              type: 'obstacle-top',
              result: 'failure',
            });
        });
      }
    }
  }

  setUpCallbacks(callbacks: {
    onCollision: (value: {
      type: BagType | 'obstacle-top' | 'obstacle-bottom';
      result: 'success' | 'failure';
    }) => void;
  }) {
    this.onCollision = callbacks.onCollision;
  }

  /**
   * @param position position of the bag.
   * @param bag bag object to tween.
   */
  animateEntry(position: BagPosition, bag: Phaser.Types.Physics.Arcade.ImageWithStaticBody) {
    switch (position) {
      case 'top-left':
        this.tweens.addCounter({
          from: 120,
          to: -20,
          duration: 400,
          onUpdate: (tween) => {
            bag.setAngle(tween.getValue());
            bag.refreshBody();
          },
        });
        this.tweens.addCounter({
          from: -20,
          to: 10,
          delay: 400,
          duration: 200,
          onUpdate: (tween) => {
            bag.setAngle(tween.getValue());
            bag.refreshBody();
          },
        });
        this.tweens.addCounter({
          from: 10,
          to: -5,
          delay: 600,
          duration: 200,
          onUpdate: (tween) => {
            bag.setAngle(tween.getValue());
            bag.refreshBody();
          },
        });
        this.tweens.addCounter({
          from: -5,
          to: 0,
          delay: 800,
          duration: 200,
          onUpdate: (tween) => {
            bag.setAngle(tween.getValue());
            bag.refreshBody();
          },
        });
        break;
      case 'top-right':
        this.tweens.addCounter({
          from: -120,
          to: 20,
          duration: 400,
          onUpdate: (tween) => {
            bag.setAngle(tween.getValue());
            bag.refreshBody();
          },
        });
        this.tweens.addCounter({
          from: 20,
          to: -10,
          delay: 400,
          duration: 200,
          onUpdate: (tween) => {
            bag.setAngle(tween.getValue());
            bag.refreshBody();
          },
        });
        this.tweens.addCounter({
          from: -10,
          to: 5,
          delay: 600,
          duration: 200,
          onUpdate: (tween) => {
            bag.setAngle(tween.getValue());
            bag.refreshBody();
          },
        });
        this.tweens.addCounter({
          from: 5,
          to: 0,
          delay: 800,
          duration: 200,
          onUpdate: (tween) => {
            bag.setAngle(tween.getValue());
            bag.refreshBody();
          },
        });
        break;
      case 'bottom-left' || 'bottom-right':
        this.tweens.addCounter({
          from: -20,
          to: 200,
          duration: 400,
          onUpdate: (tween) => {
            bag.setAngle(tween.getValue());
            bag.refreshBody();
          },
        });
        this.tweens.addCounter({
          from: 200,
          to: 170,
          delay: 400,
          duration: 200,
          onUpdate: (tween) => {
            bag.setAngle(tween.getValue());
            bag.refreshBody();
          },
        });
        this.tweens.addCounter({
          from: 170,
          to: 185,
          delay: 600,
          duration: 200,
          onUpdate: (tween) => {
            bag.setAngle(tween.getValue());
            bag.refreshBody();
          },
        });
        this.tweens.addCounter({
          from: 185,
          to: 180,
          delay: 800,
          duration: 200,
          onUpdate: (tween) => {
            bag.setAngle(tween.getValue());
            bag.refreshBody();
          },
        });
        break;
    }
  }

  /**
   *
   * @param timeout timeout in `ms`. If `timeout` is not provided, it will wait until collision is detected.
   * @returns returns collision data if collision detected or else returns failure.
   */
  waitForCollisionOrTimeout(
    timeout?: number,
  ): Promise<
    { result: 'failure' } | { bagType: string; gloveColor: string; result: 'success' | 'failure' }
  > {
    return new Promise((resolve) => {
      const startTime = new Date().getTime();
      const interval = setInterval(() => {
        // if timeout...
        if (timeout && new Date().getTime() - startTime > timeout) {
          resolve({
            result: 'failure',
          });
          clearInterval(interval);
          this.collisionDetected = undefined;
        }
        // if collision detected...
        if (this.collisionDetected) {
          resolve({
            ...this.collisionDetected,
          });
          clearInterval(interval);
          this.collisionDetected = undefined;
        }
      }, 300);
    });
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
}
