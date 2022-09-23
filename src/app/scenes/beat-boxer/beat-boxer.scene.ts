import { Injectable } from '@angular/core';
import { Results } from '@mediapipe/pose';
import { left } from '@popperjs/core';
import { Howl } from 'howler';
import { max, Subscription } from 'rxjs';
import { PoseService } from 'src/app/services/pose/pose.service';
import { audioSprites } from 'src/app/services/sounds/audio-sprites';

export type CenterOfMotion = 'left' | 'right';
export type BagType = 'heavy-blue' | 'heavy-red' | 'speed-blue' | 'speed-red';

@Injectable({
  providedIn: 'root',
})
export class BeatBoxerScene extends Phaser.Scene {
  enabled = false;
  collisions = false;
  collisionDetected?: {
    bagType: BagType | 'obstacle';
    gloveColor: 'blue' | 'red';
    result: 'success' | 'failure';
  };
  poseSubscription: Subscription;

  onCollision?: (value: {
    type: BagType | 'obstacle-top' | 'obstacle-bottom';
    result: 'success' | 'failure';
  }) => void;
  music = false;
  enableLeft = false;
  enableRight = false;
  results?: Results;

  blueGlove: Phaser.Types.Physics.Arcade.ImageWithStaticBody;
  redGlove: Phaser.Types.Physics.Arcade.ImageWithStaticBody;
  heavyBlue: Phaser.Types.Physics.Arcade.ImageWithStaticBody;
  heavyRed: Phaser.Types.Physics.Arcade.ImageWithStaticBody;
  speedRed: Phaser.Types.Physics.Arcade.ImageWithStaticBody;
  speedBlue: Phaser.Types.Physics.Arcade.ImageWithStaticBody;
  obstacle: Phaser.Types.Physics.Arcade.ImageWithStaticBody;

  wrongSign?: Phaser.Types.Physics.Arcade.ImageWithStaticBody;
  confettiAnim?: Phaser.GameObjects.Sprite;
  musicAnim?: Phaser.GameObjects.Sprite;

  constructor(private poseService: PoseService) {
    super({ key: 'beatBoxer' });
  }

  preload() {
    // default scale of desing assets
    const heavyBagScale = 1;
    const speedBagScale = 0.8;
    const handOverlayScale = 0.6;
    const obstacleScale = 1.1;

    // const { width, height } = this.game.canvas;

    // if (width < 1200) {
    //   // scale if canvas width less than 1200
    //   heavyBagScale = 0.7;
    //   speedBagScale = 0.4;
    //   handOverlayScale = 0.3;
    //   obstacleScale = 0.7;
    // }

    this.load.atlas(
      'confetti',
      'assets/images/beat-boxer/confetti.png',
      'assets/images/beat-boxer/confetti.json',
    );
    this.load.atlas(
      'music',
      'assets/images/beat-boxer/music.png',
      'assets/images/beat-boxer/music.json',
    );
    this.load.svg({
      key: 'left_hand_overlay',
      url: 'assets/images/beat-boxer/HAND_OVERLAY_LEFT.svg',
      svgConfig: {
        scale: handOverlayScale,
      },
    });
    this.load.svg({
      key: 'right_hand_overlay',
      url: 'assets/images/beat-boxer/HAND_OVERLAY_RIGHT.svg',
      svgConfig: {
        scale: handOverlayScale,
      },
    });
    this.load.svg({
      key: 'heavy_bag_blue',
      url: 'assets/images/beat-boxer/HEAVY_BAG_BLUE.svg',
      svgConfig: {
        scale: heavyBagScale,
      },
    });
    this.load.svg({
      key: 'heavy_bag_red',
      url: 'assets/images/beat-boxer/HEAVY_BAG_RED.svg',
      svgConfig: {
        scale: heavyBagScale,
      },
    });
    this.load.svg({
      key: 'speed_bag_red',
      url: 'assets/images/beat-boxer/SPEED_BAG_RED.svg',
      svgConfig: {
        scale: speedBagScale,
      },
    });
    this.load.svg({
      key: 'speed_bag_blue',
      url: 'assets/images/beat-boxer/SPEED_BAG_BLUE.svg',
      svgConfig: {
        scale: speedBagScale,
      },
    });
    this.load.svg({
      key: 'obstacle_top',
      url: 'assets/images/beat-boxer/OBSTACLE_TOP.svg',
      svgConfig: {
        scale: obstacleScale,
      },
    });
    this.load.svg({
      key: 'wrong_sign',
      url: 'assets/images/beat-boxer/WRONG_HIT.svg',
      svgConfig: {
        scale: obstacleScale,
      },
    });
  }

  create() {
    // creating confetti and music anims from the sprite sheet texture/atlas.
    this.anims.create({
      key: 'confetti_anim',
      frames: this.anims.generateFrameNames('confetti', {
        start: 1,
        end: 42,
        prefix: 'tile0',
        zeroPad: 2,
        suffix: '.png',
      }),
      duration: 1000,
      hideOnComplete: true,
    });
    this.anims.create({
      key: 'music_anim',
      frames: this.anims.generateFrameNames('music', {
        start: 68,
        end: 121,
        prefix: 'tile0',
        zeroPad: 2,
        suffix: '.png',
      }),
      duration: 1000,
      hideOnComplete: true,
    });
  }

  enable(): void {
    this.enabled = true;
    this.poseSubscription = this.poseService.getPose().subscribe((results) => {
      this.results = results;
      this.destroyGloves();
      this.drawGloves(results);
    });
  }

  destroyGloves() {
    if (this.blueGlove) {
      this.blueGlove.destroy(true);
    }
    if (this.redGlove) {
      this.redGlove.destroy(true);
    }
  }

  disable(): void {
    this.enabled = false;
    this.enableLeft = false;
    this.enableRight = false;
    this.destroyGloves();
    if (this.poseSubscription) {
      this.poseSubscription.unsubscribe();
    }
  }

  /**
   * Function to calculate distance between two coordinates.
   */
  calcDist(x1: number, y1: number, x2: number, y2: number): number {
    // distance = √[(x2 – x1)^2 + (y2 – y1)^2]
    const distance = Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
    return distance;
  }

  calculateReach(
    results: Results,
    position: CenterOfMotion,
  ): { shoulderX: number; wristX: number; maxReach: number } {
    const { width, height } = this.game.canvas;
    if (
      position === 'left' &&
      results.poseLandmarks[11] &&
      results.poseLandmarks[13] &&
      results.poseLandmarks[15]
    ) {
      const leftShoulder = results.poseLandmarks[11];
      const leftElbow = results.poseLandmarks[13];
      const leftWrist = results.poseLandmarks[15];
      const maxReach =
        this.calcDist(
          width - leftShoulder.x * width,
          leftShoulder.y * height,
          width - leftElbow.x * width,
          leftElbow.y * height,
        ) +
        this.calcDist(
          width - leftElbow.x * width,
          leftElbow.y * height,
          width - leftWrist.x * width,
          leftWrist.y * height,
        );
      return {
        shoulderX: width - leftShoulder.x * width,
        wristX: width - leftWrist.x * width,
        maxReach,
      };
    } else if (
      position === 'right' &&
      results.poseLandmarks[12] &&
      results.poseLandmarks[14] &&
      results.poseLandmarks[16]
    ) {
      const rightShoulder = results.poseLandmarks[12];
      const rightElbow = results.poseLandmarks[14];
      const rightWrist = results.poseLandmarks[16];
      const maxReach =
        this.calcDist(
          width - rightShoulder.x * width,
          rightShoulder.y * height,
          width - rightElbow.x * width,
          rightElbow.y * height,
        ) +
        this.calcDist(
          width - rightElbow.x * width,
          rightElbow.y * height,
          width - rightWrist.x * width,
          rightWrist.y * height,
        );
      return {
        shoulderX: width - rightShoulder.x * width,
        wristX: width - rightWrist.x * width,
        maxReach,
      };
    }
    return {
      wristX: 250,
      shoulderX: width / 2,
      maxReach: 200,
    };
  }

  /**
   * function to destroy existing bags on the screen/ scene.
   * * If no game object is provided, it will remove all exisiting game objects.
   * @param object game object to destroy.
   */
  async destroyGameObjects(object?: BagType | 'obstacle' | 'wrong-sign') {
    console.log('Destroy Game Objects::', object);
    switch (object) {
      case 'heavy-blue':
        if (this.heavyBlue) {
          await this.animateExit(this.heavyBlue);
        }
        break;
      case 'heavy-red':
        if (this.heavyRed) {
          await this.animateExit(this.heavyRed);
        }
        break;
      case 'speed-blue':
        if (this.speedBlue) {
          await this.animateExit(this.speedBlue);
        }
        break;
      case 'speed-red':
        if (this.speedRed) {
          await this.animateExit(this.speedRed);
        }
        break;
      case 'obstacle':
        if (this.obstacle) {
          await this.animateExit(this.obstacle);
        }
        break;
      case 'wrong-sign':
        if (this.wrongSign) {
          this.wrongSign.destroy(true);
        }
        break;
      default:
        if (this.heavyBlue) {
          await this.animateExit(this.heavyBlue);
        }
        if (this.speedBlue) {
          await this.animateExit(this.speedBlue);
        }
        if (this.heavyRed) {
          await this.animateExit(this.heavyRed);
        }
        if (this.speedRed) {
          await this.animateExit(this.speedRed);
        }
        if (this.obstacle) {
          await this.animateExit(this.obstacle);
        }
        if (this.wrongSign) {
          this.wrongSign.destroy(true);
        }
    }
  }

  midPoint(x1: number, y1: number, x2: number, y2: number) {
    return [(x1 + x2) / 2, (y1 + y2) / 2];
  }
  /**
   * Function to draw hand overlays.
   * @param results pose results
   */
  drawGloves(results: Results) {
    const { width, height } = this.game.canvas;
    if (!results || !Array.isArray(results.poseLandmarks)) {
      return;
    }
    if (results.poseLandmarks[15] && results.poseLandmarks[19] && this.enableLeft) {
      const leftWrist = results.poseLandmarks[15];
      const leftIndex = results.poseLandmarks[19];
      const [x, y] = this.midPoint(leftWrist.x, leftWrist.y, leftIndex.x, leftIndex.y);

      this.blueGlove = this.physics.add.staticImage(
        width - x * width,
        y * height,
        'left_hand_overlay',
      );
    }
    if (results.poseLandmarks[16] && results.poseLandmarks[20] && this.enableRight) {
      const rightWrist = results.poseLandmarks[16];
      const rightIndex = results.poseLandmarks[20];
      const [x, y] = this.midPoint(rightWrist.x, rightWrist.y, rightIndex.x, rightIndex.y);

      this.redGlove = this.physics.add.staticImage(
        width - x * width,
        y * height,
        'right_hand_overlay',
      );
    }
  }

  /**
   * @param gameObjectWithBody the gameObject to calculate width
   * @returns width of the gameObject
   */
  getWidth(
    gameObjectWithBody: Phaser.Types.Physics.Arcade.ImageWithStaticBody,
  ): number | undefined {
    if (gameObjectWithBody && gameObjectWithBody.body) {
      const { right, left } = gameObjectWithBody.body;
      if (right && left) return gameObjectWithBody.body.right - gameObjectWithBody.body.left;
    }
    return undefined;
  }

  /**
   * @param point the x coordination of the bag position
   * @param level level of the bag
   * @returns it will return `newX` if it is out of bounds.
   */
  isInBounds(point: number, level: number) {
    const { width } = this.game.canvas;
    const bagWidth = 160;

    if (point > width || point + bagWidth > width) {
      return {
        isInBounds: false,
        newX: width - bagWidth - 16,
      };
    } else if (point < 0 || point - bagWidth < 0) {
      return {
        isInBounds: false,
        newX: bagWidth + 16,
      };
    }

    return {
      isInBounds: true,
    };
  }

  /**
   * @param centerOfMotion Center of motion i.e. `left` or `right`.
   * @param type type of the bag.. `heavy-blue` | `speed-blue` | `heavy-red` | `speed-red`.
   * @param level Number that'll multiply with maxReach. `-ve` shifts the bag towards left and `+ve` shifts the bag to the right.
   */
  showBag(centerOfMotion: CenterOfMotion, type: BagType, level: number) {
    console.log(`position: ${centerOfMotion}, type: ${type}, level: ${level}`);
    let x = 0;
    const y = 0;
    if (this.results) {
      const { maxReach, shoulderX, wristX } = this.calculateReach(this.results, centerOfMotion);
      let tmpX = 0;
      if (centerOfMotion === 'right') {
        // pick whichever is the maximum, to reduce the chances of collision.
        tmpX = shoulderX;
        if (wristX > shoulderX) {
          tmpX = wristX;
        }
      }

      if (centerOfMotion === 'left') {
        // pick whichever is the minimum, to reduce the chances of collision.
        tmpX = shoulderX;
        if (wristX < shoulderX) {
          tmpX = wristX;
        }
      }

      x = tmpX * level;
    }
    switch (type) {
      case 'heavy-blue':
        this.heavyBlue && this.heavyBlue.destroy(true);
        const isHeavyBlueInBounds = this.isInBounds(x, level);
        if (isHeavyBlueInBounds.isInBounds) {
          this.heavyBlue = this.physics.add.staticImage(x, y, 'heavy_bag_blue').setOrigin(0.5, 0.1);
        } else {
          if (isHeavyBlueInBounds.newX) {
            this.heavyBlue = this.physics.add
              .staticImage(isHeavyBlueInBounds.newX, y, 'heavy_bag_blue')
              .setOrigin(0.5, 0.1);
          }
        }
        this.heavyBlue && this.animateEntry(this.heavyBlue);
        this.heavyBlue && this.heavyBlue.refreshBody();
        break;
      case 'heavy-red':
        this.heavyRed && this.heavyRed.destroy(true);
        const isHeavyRedInBounds = this.isInBounds(x, level);
        if (isHeavyRedInBounds.isInBounds) {
          this.heavyRed = this.physics.add.staticImage(x, y, 'heavy_bag_red').setOrigin(0.5, 0.1);
        } else {
          if (isHeavyRedInBounds.newX) {
            this.heavyRed = this.physics.add
              .staticImage(isHeavyRedInBounds.newX, y, 'heavy_bag_red')
              .setOrigin(0.5, 0.1);
          }
        }
        this.heavyRed && this.animateEntry(this.heavyRed);
        this.heavyRed && this.heavyRed.refreshBody();
        break;
      case 'speed-red':
        this.speedRed && this.speedRed.destroy(true);
        const isSpeedRedInBounds = this.isInBounds(x, level);
        if (isSpeedRedInBounds.isInBounds) {
          this.speedRed = this.physics.add.staticImage(x, y, 'speed_bag_red').setOrigin(0.5, 0.1);
        } else {
          if (isSpeedRedInBounds.newX) {
            this.speedRed = this.physics.add
              .staticImage(isSpeedRedInBounds.newX, y, 'speed_bag_red')
              .setOrigin(0.5, 0.1);
          }
        }
        this.speedRed && this.animateEntry(this.speedRed);
        this.speedRed && this.speedRed.refreshBody();
        break;
      case 'speed-blue':
        this.speedBlue && this.speedBlue.destroy(true);
        const isSpeedBlueInBounds = this.isInBounds(x, level);
        if (isSpeedBlueInBounds.isInBounds) {
          this.speedBlue = this.physics.add.staticImage(x, y, 'speed_bag_blue').setOrigin(0.5, 0.1);
        } else {
          if (isSpeedBlueInBounds.newX) {
            this.speedBlue = this.physics.add
              .staticImage(isSpeedBlueInBounds.newX, y, 'speed_bag_blue')
              .setOrigin(0.5, 0.1);
          }
        }
        this.speedBlue && this.animateEntry(this.speedBlue);
        this.speedBlue && this.speedBlue.refreshBody();
        break;
    }
  }

  getCenter(gameObject: Phaser.Types.Physics.Arcade.GameObjectWithBody): [number, number] {
    return [
      (gameObject.body.right + gameObject.body.left) / 2,
      (gameObject.body.top + gameObject.body.bottom) / 2,
    ];
  }

  /**
   * @param centerOfMotion Center of motion i.e. `left` or `right`.
   * @param level Number that'll multiply with maxReach. `-ve` shifts the bag towards left and `+ve` shifts the bag to the right.
   */
  showObstacle(centerOfMotion: CenterOfMotion, level: number) {
    const { width, height } = this.game.canvas;
    let x = 0;
    const y = 0;
    if (this.results) {
      const { maxReach, shoulderX, wristX } = this.calculateReach(this.results, centerOfMotion);

      let tmpX = 0;
      if (centerOfMotion === 'right') {
        // pick whichever is the maximum, to reduce the chances of collision.
        tmpX = shoulderX;
        if (wristX > shoulderX) {
          tmpX = wristX;
        }
      }

      if (centerOfMotion === 'left') {
        // pick whichever is the minimum, to reduce the chances of collision.
        tmpX = shoulderX;
        if (wristX < shoulderX) {
          tmpX = wristX;
        }
      }

      x = tmpX * level;
    }
    this.obstacle && this.obstacle.destroy(true);
    const isObstacleInBounds = this.isInBounds(x, level);
    if (isObstacleInBounds.isInBounds) {
      this.obstacle = this.physics.add.staticImage(x, y, 'obstacle_top').setOrigin(0.5, 0.1);
    } else {
      if (isObstacleInBounds.newX) {
        this.obstacle = this.physics.add
          .staticImage(isObstacleInBounds.newX, y, 'obstacle_top')
          .setOrigin(0.5, 0.1);
      }
    }
    this.obstacle && this.animateEntry(this.obstacle);
    this.obstacle && this.obstacle.refreshBody();
  }

  override update(time: number, delta: number): void {
    if (this.collisions) {
      if (this.blueGlove && this.heavyBlue) {
        this.physics.overlap(this.blueGlove, this.heavyBlue, async (_blueGlove, _heavyBlue) => {
          const [x, y] = this.getCenter(_heavyBlue);
          await this.animateExit(_heavyBlue as Phaser.Types.Physics.Arcade.ImageWithStaticBody);
          this.music && this.playSuccessMusic();
          this.playConfettiAnim(x, y);
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
        this.physics.overlap(this.blueGlove, this.speedBlue, async (_blueGlove, _speedBlue) => {
          const [x, y] = this.getCenter(_speedBlue);
          await this.animateExit(_speedBlue as Phaser.Types.Physics.Arcade.ImageWithStaticBody);
          this.music && this.playSuccessMusic();
          this.playConfettiAnim(x, y);
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
        this.physics.overlap(this.redGlove, this.heavyRed, async (_redGlove, _heavyRed) => {
          const [x, y] = this.getCenter(_heavyRed);
          await this.animateExit(_heavyRed as Phaser.Types.Physics.Arcade.ImageWithStaticBody);
          this.music && this.playSuccessMusic();
          this.playConfettiAnim(x, y);
          this.collisionDetected = {
            bagType: 'heavy-red',
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
        this.physics.overlap(this.redGlove, this.speedRed, async (_redGlove, _speedRed) => {
          const [x, y] = this.getCenter(_speedRed);
          await this.animateExit(_speedRed as Phaser.Types.Physics.Arcade.ImageWithStaticBody);
          this.music && this.playSuccessMusic();
          this.playConfettiAnim(x, y);
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

      if (this.redGlove && this.obstacle) {
        this.physics.overlap(this.redGlove, this.obstacle, async (_redGlove, _obstacleTop) => {
          const [x, y] = this.getCenter(_obstacleTop);
          await this.animateExit(_obstacleTop as Phaser.Types.Physics.Arcade.ImageWithStaticBody);
          this.music && this.playFailureMusic();
          this.showWrongSign(x, y);
          this.collisionDetected = {
            bagType: 'obstacle',
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

      if (this.blueGlove && this.obstacle) {
        this.physics.overlap(this.blueGlove, this.obstacle, async (_blueGlove, _obstacleTop) => {
          const [x, y] = this.getCenter(_obstacleTop);
          await this.animateExit(_obstacleTop as Phaser.Types.Physics.Arcade.ImageWithStaticBody);
          this.music && this.playFailureMusic();
          this.showWrongSign(x, y);
          this.collisionDetected = {
            bagType: 'obstacle',
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

      // wrong collisions...
      // punching blue bags with red glove or red bags with blue glove..
      if (this.blueGlove && this.heavyRed) {
        this.physics.overlap(this.blueGlove, this.heavyRed, async (_blueGlove, _heavyRed) => {
          const [x, y] = this.getCenter(_heavyRed);
          await this.animateExit(_heavyRed as Phaser.Types.Physics.Arcade.ImageWithStaticBody);
          this.music && this.playFailureMusic();
          this.showWrongSign(x, y);
          this.collisionDetected = {
            bagType: 'heavy-red',
            gloveColor: 'blue',
            result: 'failure',
          };
          this.onCollision &&
            this.onCollision({
              type: 'heavy-red',
              result: 'failure',
            });
        });
      }

      if (this.blueGlove && this.speedRed) {
        this.physics.overlap(this.blueGlove, this.speedRed, async (_blueGlove, _speedRed) => {
          const [x, y] = this.getCenter(_speedRed);
          await this.animateExit(_speedRed as Phaser.Types.Physics.Arcade.ImageWithStaticBody);
          this.music && this.playFailureMusic();
          this.showWrongSign(x, y);
          this.collisionDetected = {
            bagType: 'speed-red',
            gloveColor: 'blue',
            result: 'failure',
          };
          this.onCollision &&
            this.onCollision({
              type: 'speed-red',
              result: 'failure',
            });
        });
      }

      if (this.redGlove && this.heavyBlue) {
        this.physics.overlap(this.redGlove, this.heavyBlue, async (_redGlove, _heavyBlue) => {
          const [x, y] = this.getCenter(_heavyBlue);
          await this.animateExit(_heavyBlue as Phaser.Types.Physics.Arcade.ImageWithStaticBody);
          this.music && this.playFailureMusic();
          this.showWrongSign(x, y);
          this.collisionDetected = {
            bagType: 'heavy-blue',
            gloveColor: 'red',
            result: 'failure',
          };
          this.onCollision &&
            this.onCollision({
              type: 'heavy-blue',
              result: 'failure',
            });
        });
      }

      if (this.redGlove && this.speedBlue) {
        this.physics.overlap(this.redGlove, this.speedBlue, async (_redGlove, _speedBlue) => {
          this.music && this.playFailureMusic();
          const [x, y] = this.getCenter(_speedBlue);
          await this.animateExit(_speedBlue as Phaser.Types.Physics.Arcade.ImageWithStaticBody);
          this.showWrongSign(x, y);
          this.collisionDetected = {
            bagType: 'speed-blue',
            gloveColor: 'red',
            result: 'failure',
          };
          this.onCollision &&
            this.onCollision({
              type: 'speed-blue',
              result: 'failure',
            });
        });
      }
    }
  }

  playConfettiAnim(x: number, y: number) {
    this.add.sprite(x, y, 'confetti').play('confetti_anim');
    this.add.sprite(x, y, 'music').play('music_anim');
  }

  showWrongSign(x: number, y: number) {
    if (this.wrongSign) {
      this.wrongSign.destroy(true);
    }
    this.wrongSign = this.physics.add.staticImage(x, y, 'wrong_sign');
    setTimeout(() => {
      this.wrongSign && this.wrongSign.destroy(true);
    }, 1000);
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
   * @param bag bag object to tween.
   */
  animateEntry(bag: Phaser.Types.Physics.Arcade.ImageWithStaticBody) {
    this.tweens.addCounter({
      from: -120,
      to: 20,
      duration: 300,
      onUpdate: (tween) => {
        if (bag.body) {
          bag.setY(tween.getValue());
          bag.refreshBody();
        }
      },
    });
    this.tweens.addCounter({
      from: 20,
      to: -10,
      delay: 300,
      duration: 100,
      onUpdate: (tween) => {
        if (bag.body) {
          bag.setY(tween.getValue());
          bag.refreshBody();
        }
      },
    });
    this.tweens.addCounter({
      from: -10,
      to: 5,
      delay: 400,
      duration: 100,
      onUpdate: (tween) => {
        if (bag.body) {
          bag.setY(tween.getValue());
          bag.refreshBody();
        }
      },
    });
    this.tweens.addCounter({
      from: 5,
      to: 0,
      delay: 500,
      duration: 100,
      onUpdate: (tween) => {
        if (bag.body) {
          bag.setY(tween.getValue());
          bag.refreshBody();
        }
      },
    });
  }

  /**
   * @param bag bag object to tween.
   */
  async animateExit(bag: Phaser.Types.Physics.Arcade.ImageWithStaticBody) {
    return new Promise((resolve) => {
      let bagHeight = 700;
      if (bag.body) {
        bagHeight = bag.body.bottom - bag.body.top;
      }
      this.tweens.addCounter({
        from: 0,
        to: -bagHeight,
        duration: 100,
        onUpdate: (tween) => {
          if (bag.body) {
            bag.setY(tween.getValue());
            bag.refreshBody();
          }
        },
        onComplete: () => {
          if (bag.body) {
            bag.destroy(true);
            resolve({});
          }
        },
      });
    });
  }

  /**
   * @param timeout timeout in `ms`. If `timeout` is not provided, it will wait until collision is detected.
   * @returns returns collision data if collision detected or else returns failure.
   */
  waitForCollisionOrTimeout(
    bag1?: BagType | 'obstacle',
    bag2?: BagType | 'obstacle',
    timeout?: number,
  ): Promise<
    | { result: undefined }
    | { bagType: BagType | 'obstacle'; gloveColor: string; result: 'success' | 'failure' }
  > {
    return new Promise((resolve) => {
      const startTime = new Date().getTime();
      const interval = setInterval(() => {
        // if timeout...
        if (timeout && new Date().getTime() - startTime > timeout) {
          resolve({
            result: undefined,
          });
          clearInterval(interval);
          this.collisionDetected = undefined;
        }
        // if collision detected...
        if (
          this.collisionDetected &&
          this.collisionDetected.bagType &&
          (this.collisionDetected.bagType === bag1 || this.collisionDetected.bagType === bag2)
        ) {
          resolve({ ...this.collisionDetected! });
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

  failureMusic: Howl;
  successMusic: Howl;
  failureMusicId: number;
  configureMusic() {
    this.failureMusic = new Howl({
      src: 'assets/sounds/soundscapes/Sound Health Soundscape_decalibrate.mp3',
      html5: true,
    });

    this.successMusic = new Howl({
      src: 'assets/sounds/soundsprites/beat-boxer/beatBoxer.mp3',
      sprite: audioSprites.beatBoxer,
      html5: true,
    });
  }

  getDurationOfNote(note: number) {
    return audioSprites['beatBoxer'][`note_${note}`][1];
  }

  nextPianoNote = 1;
  playSuccessMusic() {
    const fadeOutDuration = 750;
    const noteDuration = this.getDurationOfNote(this.nextPianoNote);
    const durationBeforeFadeOut = noteDuration - fadeOutDuration;
    // console.log('durationBeforeFadeOut:', durationBeforeFadeOut);
    console.log('playing piano note, ', this.nextPianoNote);
    this.successMusic.volume(1);
    this.successMusic.play(`note_${this.nextPianoNote}`);
    setTimeout(() => {
      this.successMusic.fade(1, 0, fadeOutDuration);
    }, durationBeforeFadeOut);
    this.nextPianoNote += 1;
  }

  playFailureMusic() {
    if (this.failureMusic && this.failureMusic.playing(this.failureMusicId)) {
      this.failureMusic.stop();
    }
    if (this.failureMusic && !this.failureMusic.playing(this.failureMusicId)) {
      this.failureMusicId = this.failureMusic.play();
    }
  }

  /**
   * @param value default `true`.
   */
  enableMusic(value = true) {
    this.music = value;
  }
}
