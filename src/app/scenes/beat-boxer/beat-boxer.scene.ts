import { Injectable } from '@angular/core';
import { Results } from '@mediapipe/pose';
import { left } from '@popperjs/core';
import { Howl } from 'howler';
import { reject } from 'lodash';
import { max, Subscription } from 'rxjs';
import { PoseService } from 'src/app/services/pose/pose.service';
import { audioSprites } from 'src/app/services/sounds/audio-sprites';
import { TtsService } from 'src/app/services/tts/tts.service';

export type GameObjectWithBodyAndTexture = Phaser.GameObjects.GameObject & {
  body: Phaser.Physics.Arcade.Body | Phaser.Physics.Arcade.StaticBody;
  texture?: {
    key: string;
  };
};
export type CenterOfMotion = 'left' | 'right';
export type BagType = 'heavy-blue' | 'heavy-red' | 'speed-blue' | 'speed-red';
export enum TextureKeys {
  HEAVY_BLUE = 'heavy-blue',
  SPEED_BLUE = 'speed-blue',
  HEAVY_RED = 'heavy-red',
  SPEED_RED = 'speed-red',
  OBSTACLE = 'obstacle',
  LEFT_HAND = 'left-hand',
  RIGHT_HAND = 'right-hand',
}

@Injectable({
  providedIn: 'root',
})
export class BeatBoxerScene extends Phaser.Scene {
  enabled = false;
  collisions = false;
  collisionDetected?: {
    bagType: string;
    gloveColor: 'blue' | 'red';
    result: 'success' | 'failure';
  };
  poseSubscription: Subscription;

  music = false;
  enableLeft = false;
  enableRight = false;
  results?: Results;

  blueGloveCollisionCallback = async (
    _blueGlove: Phaser.Types.Physics.Arcade.GameObjectWithBody,
    _gameObject: GameObjectWithBodyAndTexture,
  ) => {
    if (!_gameObject || !_gameObject.texture) {
      return;
    }
    const [x, y] = this.getCenter(_gameObject);
    const textureKey = _gameObject.texture.key;
    const exitAnimComplete = await this.animateExit(
      _gameObject as Phaser.Types.Physics.Arcade.ImageWithStaticBody,
    );
    if (exitAnimComplete) {
      if (textureKey === TextureKeys.HEAVY_BLUE || textureKey === TextureKeys.SPEED_BLUE) {
        console.log(`collision::blueGlove::${textureKey}`);
        this.music && this.playSuccessMusic();
        this.playConfettiAnim(x, y);
        this.collisionDetected = {
          bagType: textureKey,
          gloveColor: 'blue',
          result: 'success',
        };
      } else {
        this.music && this.playFailureMusic();
        this.showWrongSign(x, y);
        this.collisionDetected = {
          bagType: textureKey,
          gloveColor: 'blue',
          result: 'failure',
        };
      }
    }
  };

  redGloveCollisionCallback = async (
    _redGlove: Phaser.Types.Physics.Arcade.GameObjectWithBody,
    _gameObject: GameObjectWithBodyAndTexture,
  ) => {
    if (!_gameObject || !_gameObject.texture) {
      return;
    }
    const [x, y] = this.getCenter(_gameObject);
    const textureKey = _gameObject.texture.key;
    const exitAnimComplete = await this.animateExit(
      _gameObject as Phaser.Types.Physics.Arcade.ImageWithStaticBody,
    );
    if (exitAnimComplete) {
      if (textureKey === TextureKeys.HEAVY_RED || textureKey === TextureKeys.SPEED_RED) {
        console.log(`collision::redGlove::${textureKey}`);
        this.music && this.playSuccessMusic();
        this.playConfettiAnim(x, y);

        this.collisionDetected = {
          bagType: textureKey,
          gloveColor: 'red',
          result: 'success',
        };
      } else {
        this.music && this.playFailureMusic();
        this.showWrongSign(x, y);
        this.collisionDetected = {
          bagType: textureKey,
          gloveColor: 'red',
          result: 'failure',
        };
      }
    }
  };

  blueGlove: Phaser.Types.Physics.Arcade.ImageWithStaticBody;
  redGlove: Phaser.Types.Physics.Arcade.ImageWithStaticBody;

  wrongSign?: Phaser.Types.Physics.Arcade.ImageWithStaticBody;
  confettiAnim?: Phaser.GameObjects.Sprite;
  musicAnim?: Phaser.GameObjects.Sprite;

  designAssetsLoaded = false;
  musicFilesLoaded = 0;
  totalMusicFiles = 2;
  loadError = false;

  constructor(private poseService: PoseService, private ttsService: TtsService) {
    super({ key: 'beatBoxer' });
  }

  preload() {
    this.designAssetsLoaded = false;
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
      key: TextureKeys.LEFT_HAND,
      url: 'assets/images/beat-boxer/HAND_OVERLAY_LEFT.svg',
      svgConfig: {
        scale: handOverlayScale,
      },
    });
    this.load.svg({
      key: TextureKeys.RIGHT_HAND,
      url: 'assets/images/beat-boxer/HAND_OVERLAY_RIGHT.svg',
      svgConfig: {
        scale: handOverlayScale,
      },
    });
    this.load.svg({
      key: TextureKeys.HEAVY_BLUE,
      url: 'assets/images/beat-boxer/HEAVY_BAG_BLUE.svg',
      svgConfig: {
        scale: heavyBagScale,
      },
    });
    this.load.svg({
      key: TextureKeys.HEAVY_RED,
      url: 'assets/images/beat-boxer/HEAVY_BAG_RED.svg',
      svgConfig: {
        scale: heavyBagScale,
      },
    });
    this.load.svg({
      key: TextureKeys.SPEED_RED,
      url: 'assets/images/beat-boxer/SPEED_BAG_RED.svg',
      svgConfig: {
        scale: speedBagScale,
      },
    });
    this.load.svg({
      key: TextureKeys.SPEED_BLUE,
      url: 'assets/images/beat-boxer/SPEED_BAG_BLUE.svg',
      svgConfig: {
        scale: speedBagScale,
      },
    });
    this.load.svg({
      key: TextureKeys.OBSTACLE,
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

    this.failureMusic = new Howl({
      src: 'assets/sounds/soundscapes/Sound Health Soundscape_decalibrate.mp3',
      html5: true,
      onload: this.onLoadCallback,
      onloaderror: this.onLoadErrorCallback,
    });

    this.successMusic = new Howl({
      src: 'assets/sounds/soundsprites/beat-boxer/beatBoxer.mp3',
      sprite: audioSprites.beatBoxer,
      html5: true,
      loop: false,
      onfade: (id) => {
        this.successMusic.stop(id);
      },
      onload: this.onLoadCallback,
      onloaderror: this.onLoadErrorCallback,
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

  onLoadCallback = () => {
    this.musicFilesLoaded += 1;
  };

  onLoadErrorCallback = () => {
    this.loadError = true;
  };

  checkIfAssetsAreLoaded() {
    return this.designAssetsLoaded && this.musicFilesLoaded === this.totalMusicFiles;
  }

  async waitForAssetsToLoad() {
    await this.ttsService.preLoadTts('beat_boxer');
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

  private group: Phaser.Physics.Arcade.StaticGroup;

  create() {
    // creating confetti and music anims from the sprite sheet texture/atlas.

    this.group = this.physics.add.staticGroup({});

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
    // alert('beat boxer scene enabled');
    this.enabled = true;
    this.enableLeftHand();
    this.enableRightHand();
    this.enableCollisionDetection();
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

    // if results or results.poseLandmarks are not present.. return default values.
    if (!results || !Array.isArray(results.poseLandmarks)) {
      return {
        wristX: 250,
        shoulderX: width / 2,
        maxReach: 200,
      };
    }

    if (
      position === 'left' &&
      results &&
      results.poseLandmarks &&
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
      results &&
      results.poseLandmarks &&
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
    if (!object) {
      this.group.clear(true, true);
    } else {
      this.group.getChildren().forEach((child: any) => {
        if (!child || !child.texture || !child.texture.key) {
          return;
        }
        if (child.texture.key === object) {
          this.animateExit(child);
        }
      });
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
        TextureKeys.LEFT_HAND,
      );
    }
    if (results.poseLandmarks[16] && results.poseLandmarks[20] && this.enableRight) {
      const rightWrist = results.poseLandmarks[16];
      const rightIndex = results.poseLandmarks[20];
      const [x, y] = this.midPoint(rightWrist.x, rightWrist.y, rightIndex.x, rightIndex.y);

      this.redGlove = this.physics.add.staticImage(
        width - x * width,
        y * height,
        TextureKeys.RIGHT_HAND,
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

    let gameObject!: Phaser.Types.Physics.Arcade.SpriteWithStaticBody;
    const isBagInBounds = this.isInBounds(x, level);
    if (isBagInBounds.isInBounds) {
      gameObject = this.physics.add.staticSprite(x, y, type).setOrigin(0.5, 0.1);
    } else {
      if (isBagInBounds.newX) {
        gameObject = this.physics.add.staticSprite(isBagInBounds.newX, y, type).setOrigin(0.5, 0.1);
      }
    }
    this.group && this.group.add(gameObject);
    if (gameObject) {
      this.animateEntry(gameObject);
      gameObject.refreshBody();
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

    let gameObject!: Phaser.Types.Physics.Arcade.SpriteWithStaticBody;

    const isObstacleInBounds = this.isInBounds(x, level);
    if (isObstacleInBounds.isInBounds) {
      gameObject = this.physics.add.staticSprite(x, y, TextureKeys.OBSTACLE).setOrigin(0.5, 0.1);
    } else {
      if (isObstacleInBounds.newX) {
        gameObject = this.physics.add
          .staticSprite(isObstacleInBounds.newX, y, TextureKeys.OBSTACLE)
          .setOrigin(0.5, 0.1);
      }
    }
    this.group && this.group.add(gameObject);
    if (gameObject) {
      this.animateEntry(gameObject);
      gameObject.refreshBody();
    }
  }

  override update(time: number, delta: number): void {
    if (this.collisions) {
      if (this.blueGlove && this.group) {
        this.physics.overlap(this.blueGlove, this.group, this.blueGloveCollisionCallback);
      }
      if (this.redGlove && this.group) {
        this.physics.overlap(this.redGlove, this.group, this.redGloveCollisionCallback);
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
    return new Promise<boolean>((resolve) => {
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
            resolve(true);
          } else {
            resolve(false);
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
    { result: undefined } | { bagType: string; gloveColor: string; result: 'success' | 'failure' }
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
    const successToneId = this.successMusic.play(`note_${this.nextPianoNote}`);
    setTimeout(() => {
      this.successMusic.fade(1, 0, fadeOutDuration, successToneId);
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

    // if disabled... unload music files
    if (!value) {
      this.failureMusic && this.failureMusic.unload();
      this.successMusic && this.successMusic.unload();
    }
  }
}
