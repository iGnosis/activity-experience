import { Injectable } from '@angular/core';
import { Results } from '@mediapipe/pose';
import { Subscription } from 'rxjs';
import { PoseService } from 'src/app/services/pose/pose.service';
import { TtsService } from 'src/app/services/tts/tts.service';

enum TextureKeys {
  CIRCLE = 'circle_shape',
}

enum AnimationKeys {}

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

  designAssetsLoaded = false;
  musicFilesLoaded = 0;
  totalMusicFiles = 0;
  loadError = false;

  private collisionCallback = (
    _hand: Phaser.Types.Physics.Arcade.GameObjectWithBody,
    _gameObject: GameObjectWithBodyAndTexture,
  ) => {
    if (!_gameObject.texture) return;
    _gameObject.destroy(true);
  };

  constructor(private ttsService: TtsService, private poseService: PoseService) {
    super({ key: 'movingTones' });
  }

  preload() {
    this.load.image({
      key: TextureKeys.CIRCLE,
      url: 'assets/images/sound-slicer/Circle shape.png',
    });

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
    this.group = this.physics.add.staticGroup({});
  }
  override update(time: number, delta: number): void {
    if (this.collisions) {
      if (this.leftHand && this.group && this.group.getLength() >= 1) {
        this.physics.overlap(this.leftHand, this.group, this.collisionCallback);
      }
      if (this.rightHand && this.group && this.group.getLength() >= 1) {
        this.physics.overlap(this.rightHand, this.group, this.collisionCallback);
      }
    }
  }

  showHoldPoseCircle(x: number, y: number) {}

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
