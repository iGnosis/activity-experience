import { Injectable } from '@angular/core';
import { Results } from '@mediapipe/pose';
import { Subscription } from 'rxjs';
import { PoseService } from 'src/app/services/pose/pose.service';
import { TtsService } from 'src/app/services/tts/tts.service';

enum TextureKeys {
  RED_CIRCLE = 'red_circle',
  BLUE_CIRCLE = 'blue_circle',
  MUSIC_CIRCLE = 'music_circle',
  BLUE_DONE = 'blue_done',
  RED_DONE = 'red_done',
  RED_BLUE_RIPPLE = 'red_blue_ripple',
  GREEN_BUBBLES = 'green_bubbles',
}

enum AnimationKeys {
  RED_BLUE_RIPPLE_ANIM = 'red_blue_ripple_anim',
  GREEN_BUBBLES_ANIM = 'green_bubbles_anim',
}

interface TweenData {
  stoppedAt?: number;
  remainingDuration?: number;
  totalTimeElapsed: number;
  tween?: Phaser.Tweens.Tween;
}

type GameObjectWithBodyAndTexture = Phaser.GameObjects.GameObject & {
  body: Phaser.Physics.Arcade.Body | Phaser.Physics.Arcade.StaticBody;
  texture?: {
    key: string;
  };
};

@Injectable({
  providedIn: 'root',
})
export class MovingTonesScene extends Phaser.Scene {
  private enableLeft = false;
  private enableRight = false;
  private collisions = false;
  private leftHand: Phaser.GameObjects.Arc;
  private rightHand: Phaser.GameObjects.Arc;
  private enabled = false;
  private poseSubscription: Subscription;
  private music = false;
  private group: Phaser.Physics.Arcade.StaticGroup;
  private circleScale = 0.6;
  private holdDuration = 4000;

  designAssetsLoaded = false;
  musicFilesLoaded = 0;
  totalMusicFiles = 0;
  loadError = false;

  private isBlueHeld = false;
  private isRedHeld = false;

  private redTween: TweenData = {
    stoppedAt: undefined,
    remainingDuration: undefined,
    totalTimeElapsed: 0,
  };

  private blueTween: TweenData = {
    stoppedAt: undefined,
    remainingDuration: undefined,
    totalTimeElapsed: 0,
  };

  private rightCollisionCallback = (
    _hand: Phaser.Types.Physics.Arcade.GameObjectWithBody,
    gameObject: GameObjectWithBodyAndTexture,
  ) => {
    if (!gameObject.texture) return;
    if (gameObject.texture.key === TextureKeys.BLUE_CIRCLE) return;

    if (gameObject.texture.key === TextureKeys.MUSIC_CIRCLE) {
      // TODO: Add animation before destroying
      gameObject.destroy(true);
    }

    if (gameObject.texture.key === TextureKeys.RED_CIRCLE) {
      const [type, color, startFromBeginning]: ['start' | 'end', number, boolean] =
        gameObject.getData(['type', 'color', 'startFromBeginning']);

      if (this.isRedHeld === false) {
        this.isRedHeld = true;
        const { x, y } = gameObject.body.center;
        const circleRadius = (gameObject.body.right - gameObject.body.left) / 2;

        const { tween: redTween, graphics } =
          this.redTween.remainingDuration === undefined || this.redTween.stoppedAt === undefined
            ? this.animateHeld(x, y, circleRadius, color, 0, this.holdDuration)
            : this.animateHeld(
                x,
                y,
                circleRadius,
                color,
                this.redTween.stoppedAt,
                this.redTween.remainingDuration,
              );

        redTween.on('update', (tween: Phaser.Tweens.Tween) => {
          if (!this.isRedHeld) {
            if (startFromBeginning) {
              graphics.destroy(true);
              redTween.remove();
              this.destroyGameObjects(TextureKeys.MUSIC_CIRCLE);
              this.redTween = {
                remainingDuration: undefined,
                stoppedAt: undefined,
                totalTimeElapsed: 0,
              };
            } else {
              this.redTween = {
                stoppedAt: tween.getValue(),
                remainingDuration: tween.duration - tween.elapsed,
                totalTimeElapsed: this.redTween.totalTimeElapsed + tween.elapsed,
              };
              console.log(this.redTween.totalTimeElapsed);
              graphics.destroy(true);
              tween.remove();
            }
          }
        });

        redTween.once('complete', () => {
          this.redTween = {
            remainingDuration: undefined,
            stoppedAt: undefined,
            totalTimeElapsed: 0,
          };
          graphics.destroy(true);
          redTween.remove();
          gameObject.destroy(true);

          if (type === 'start') {
            const sprite = this.add.sprite(x, y, TextureKeys.RED_DONE);
            this.tweens.addCounter({
              ease: 'Linear',
              duration: 300,
              from: 1,
              to: 1.1,
              onUpdate: (tween) => {
                sprite.setScale(tween.getValue());
              },
              onComplete: (tween) => {
                tween.remove();
                sprite.destroy(true);
              },
            });
          } else {
            this.add
              .sprite(x, y, TextureKeys.RED_BLUE_RIPPLE)
              .setScale(this.circleScale)
              .play(AnimationKeys.RED_BLUE_RIPPLE_ANIM);
          }
        });
      }
    }
  };

  private leftCollisionCallback = (
    _hand: Phaser.Types.Physics.Arcade.GameObjectWithBody,
    gameObject: GameObjectWithBodyAndTexture,
  ) => {
    if (!gameObject.texture) return;

    if (gameObject.texture.key === TextureKeys.RED_CIRCLE) return;

    if (gameObject.texture.key === TextureKeys.MUSIC_CIRCLE) {
      // TODO: Add animation before destroying
      gameObject.destroy(true);
    }

    if (gameObject.texture.key === TextureKeys.BLUE_CIRCLE) {
      const [type, color, startFromBeginning]: ['start' | 'end', number, boolean] =
        gameObject.getData(['type', 'color', 'startFromBeginning']);

      if (this.isBlueHeld === false) {
        this.isBlueHeld = true;

        const { x, y } = gameObject.body.center;
        const circleRadius = (gameObject.body.right - gameObject.body.left) / 2;

        const { tween: blueTween, graphics } =
          this.blueTween.remainingDuration === undefined || this.blueTween.stoppedAt === undefined
            ? this.animateHeld(x, y, circleRadius, color)
            : this.animateHeld(
                x,
                y,
                circleRadius,
                color,
                this.blueTween.stoppedAt,
                this.blueTween.remainingDuration,
              );

        blueTween.on('update', (tween: Phaser.Tweens.Tween) => {
          if (!this.isBlueHeld) {
            if (startFromBeginning) {
              graphics.destroy(true);
              blueTween.remove();
              this.destroyGameObjects(TextureKeys.MUSIC_CIRCLE);
              this.blueTween = {
                remainingDuration: undefined,
                stoppedAt: undefined,
                totalTimeElapsed: 0,
              };
            } else {
              this.blueTween = {
                stoppedAt: tween.getValue(),
                remainingDuration: tween.duration - tween.elapsed,
                totalTimeElapsed: this.blueTween.totalTimeElapsed + tween.elapsed,
              };
              graphics.destroy(true);
              tween.remove();
            }
          }
        });

        blueTween.once('complete', () => {
          this.blueTween = {
            remainingDuration: undefined,
            stoppedAt: undefined,
            totalTimeElapsed: 0,
          };
          graphics.destroy(true);
          blueTween.remove();
          gameObject.destroy(true);

          if (type === 'start') {
            const sprite = this.add.sprite(x, y, TextureKeys.BLUE_DONE);
            this.tweens.addCounter({
              ease: 'Linear',
              duration: 300,
              from: 1,
              to: 1.1,
              onUpdate: (tween) => {
                sprite.setScale(tween.getValue());
              },
              onComplete: (tween) => {
                tween.remove();
                sprite.destroy(true);
              },
            });
          } else {
            this.add
              .sprite(x, y, TextureKeys.RED_BLUE_RIPPLE)
              .setScale(this.circleScale)
              .play(AnimationKeys.RED_BLUE_RIPPLE_ANIM);
          }
        });
      }
    }
  };

  constructor(private ttsService: TtsService, private poseService: PoseService) {
    super({ key: 'movingTones' });
  }

  preload() {
    this.load.image({
      key: TextureKeys.RED_CIRCLE,
      url: 'assets/images/moving-tones/red-circle.svg',
    });

    this.load.image({
      key: TextureKeys.BLUE_CIRCLE,
      url: 'assets/images/moving-tones/blue-circle.svg',
    });
    this.load.image({
      key: TextureKeys.MUSIC_CIRCLE,
      url: 'assets/images/moving-tones/music-circle.svg',
    });
    this.load.svg({
      key: TextureKeys.BLUE_DONE,
      url: 'assets/images/moving-tones/done-blue.svg',
      svgConfig: {
        scale: 0.6,
      },
    });

    this.load.svg({
      key: TextureKeys.RED_DONE,
      url: 'assets/images/moving-tones/done-red.svg',
      svgConfig: {
        scale: 0.6,
      },
    });

    this.load.atlas(
      TextureKeys.RED_BLUE_RIPPLE,
      'assets/images/moving-tones/ripple/blue-red-ripple.png',
      'assets/images/moving-tones/ripple/blue-red-ripple.json',
    );

    this.load.once('complete', (_id: any, _completed: number, failed: number) => {
      if (failed === 0) {
        this.designAssetsLoaded = true;
      } else {
        console.log('Design Assets Failed to Load', failed);
        this.loadError = true;
      }
    });
  }
  create() {
    this.anims.create({
      key: AnimationKeys.RED_BLUE_RIPPLE_ANIM,
      frames: this.anims.generateFrameNames(TextureKeys.RED_BLUE_RIPPLE, {
        start: 5,
        end: 35,
        prefix: 'tile0',
        zeroPad: 2,
        suffix: '.png',
      }),
      // skipMissedFrames: true,
      duration: 1000,
      hideOnComplete: true,
    });

    this.group = this.physics.add.staticGroup({});
  }

  override update(time: number, delta: number): void {
    if (this.collisions) {
      if (this.leftHand && this.group && this.group.getLength() >= 1) {
        if (!this.physics.overlap(this.leftHand, this.group, this.leftCollisionCallback)) {
          this.isBlueHeld = false;
        }
      }
      if (this.rightHand && this.group && this.group.getLength() >= 1) {
        if (!this.physics.overlap(this.rightHand, this.group, this.rightCollisionCallback)) {
          this.isRedHeld = false;
        }
      }
    }
  }

  showHoldCircle(
    x: number,
    y: number,
    textureColor: 'red' | 'blue',
    type: 'start' | 'end',
    startFromBeginning = true,
  ) {
    const scale = 0.7;
    const textureKey = textureColor === 'red' ? TextureKeys.RED_CIRCLE : TextureKeys.BLUE_CIRCLE;
    const color = textureColor === 'red' ? 0xeb0000 : 0x2f51ae;
    const gameObject = this.physics.add.staticSprite(x, y, textureKey).setScale(scale);
    if (gameObject && this.group) {
      gameObject.setData({
        type,
        color,
        startFromBeginning,
      });
      gameObject.refreshBody();
      this.group.add(gameObject);
    }
  }

  showMusicCircle(x: number, y: number) {
    const gameObject = this.physics.add
      .staticSprite(x, y, TextureKeys.MUSIC_CIRCLE)
      .setScale(this.circleScale);
    if (gameObject && this.group) {
      // gameObject.setData({});
      gameObject.refreshBody();
      this.group.add(gameObject);
    }
  }

  async destroyGameObjects(object?: string) {
    console.log('Destroy Game Objects::', object || 'ALL');
    if (!object) {
      this.group.clear(true, true);
    } else {
      this.group.getChildren().forEach((child: any) => {
        if (!child || !child.texture || !child.texture.key) return;
        if (child.texture.key === object) {
          child.destroy(true);
        }
      });
    }
  }

  waitForCollisionOrTimeout(timeout?: number): Promise<void> {
    return new Promise<void>((resolve, _reject) => {
      const startTime = new Date().getTime();
      const interval = setInterval(() => {
        // if timeout...
        if (timeout && new Date().getTime() - startTime > timeout) {
          resolve();
          clearInterval(interval);
        }
        // if collision detected...
        if (this.group && this.group.getLength() === 0) {
          resolve();
          clearInterval(interval);
        }
      }, 300);
    });
  }

  animateHeld(
    x: number,
    y: number,
    radius: number,
    color: number,
    startAngle = 0,
    duration = 4000,
  ) {
    const graphics: Phaser.GameObjects.Graphics = this.add.graphics().setDepth(-1);
    const tween = this.tweens.addCounter({
      from: startAngle,
      to: 360,
      duration: duration,
      ease: 'Linear',
      useFrames: false,
      onUpdate: function (tween) {
        const angle = tween.getValue();
        graphics.clear();
        graphics.fillStyle(color, 1);
        graphics.slice(
          x,
          y,
          radius + 8,
          Phaser.Math.DegToRad(0),
          Phaser.Math.DegToRad(angle),
          false,
        );
        graphics.fillPath();
      },
    });
    return { tween, graphics };
  }

  checkIfAssetsAreLoaded() {
    return this.designAssetsLoaded && this.musicFilesLoaded === this.totalMusicFiles;
  }

  async waitForAssetsToLoad() {
    // TODO: Preload TTS for movingTones
    // await this.ttsService.preLoadTts('movingTones');
    return new Promise<void>((resolve, reject) => {
      const startTime = new Date().getTime();
      const intervalId = setInterval(() => {
        if (this.checkIfAssetsAreLoaded() && new Date().getTime() - startTime >= 2500) {
          clearInterval(intervalId);
          resolve();
          return;
        }
        if (this.loadError) {
          clearInterval(intervalId);
          reject('Failed to load some design assets.');
          return;
        }
      }, 200);
    });
  }

  enable(): void {
    this.enabled = true;
    this.enableCollisionDetection();
    this.enableLeftHand();
    this.enableRightHand();
    this.subscribe();
  }

  subscribe() {
    this.poseSubscription = this.poseService.getPose().subscribe((results) => {
      if (this.leftHand) {
        this.leftHand.destroy(true);
      }
      if (this.rightHand) {
        this.rightHand.destroy(true);
      }
      this.drawHands(results);
    });
  }

  disable(): void {
    this.enabled = false;
    this.unsubscribe();
  }

  unsubscribe() {
    if (this.poseSubscription) {
      this.poseSubscription.unsubscribe();
    }
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

  /**
   * @param results Pose Results
   */
  drawHands(results: Results): void {
    const handObjectRadius = 20;
    const handObjectColor = 0xffffff;
    const handObjectOpacity = 0.5;
    const { width, height } = this.game.canvas;
    if (!results || !Array.isArray(results.poseLandmarks)) {
      return;
    }
    if (results.poseLandmarks[15] && results.poseLandmarks[19] && this.enableLeft) {
      const leftWrist = results.poseLandmarks[15];
      const leftIndex = results.poseLandmarks[19];
      const [x, y] = this.midPoint(leftWrist.x, leftWrist.y, leftIndex.x, leftIndex.y);

      this.leftHand = this.physics.add.existing(
        this.add.circle(
          width - x * width,
          y * height,
          handObjectRadius,
          handObjectColor,
          handObjectOpacity,
        ),
      );
    }
    if (results.poseLandmarks[16] && results.poseLandmarks[20] && this.enableRight) {
      const rightWrist = results.poseLandmarks[16];
      const rightIndex = results.poseLandmarks[20];
      const [x, y] = this.midPoint(rightWrist.x, rightWrist.y, rightIndex.x, rightIndex.y);

      // this.rightHand = this.add.arc(width - x * width, y * height, 25, 0, 360, false, 0xffffff, 0.5);
      this.rightHand = this.physics.add.existing(
        this.add.circle(
          width - x * width,
          y * height,
          handObjectRadius,
          handObjectColor,
          handObjectOpacity,
        ),
      );
    }
  }

  /**
   * @returns midpoint of (x1, y1) and (x2, y2).
   */
  midPoint(x1: number, y1: number, x2: number, y2: number) {
    return [(x1 + x2) / 2, (y1 + y2) / 2];
  }

  playSuccessMusic() {}
  playFailureMusic() {}
  /**
   * @param value default `true`.
   */
  enableMusic(value = true) {
    this.music = value;
  }
}
