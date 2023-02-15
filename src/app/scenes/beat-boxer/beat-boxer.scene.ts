import { Injectable } from '@angular/core';
import { Results } from '@mediapipe/pose';
import { Howl } from 'howler';
import { Subscription } from 'rxjs';
import { PoseModelAdapter } from 'src/app/services/pose-model-adapter/pose-model-adapter.service';
import { audioSprites } from 'src/app/services/sounds/audio-sprites';
import { beatBoxerAudio } from 'src/app/services/sounds/beat-boxer.audiosprite';
import { TtsService } from 'src/app/services/tts/tts.service';
import {
  BagType,
  CenterOfMotion,
  GameObjectWithBodyAndTexture,
  Genre,
} from 'src/app/types/pointmotion';

enum TextureKeys {
  HEAVY_BLUE = 'heavy-blue',
  SPEED_BLUE = 'speed-blue',
  HEAVY_RED = 'heavy-red',
  SPEED_RED = 'speed-red',
  OBSTACLE = 'obstacle',
  LEFT_HAND = 'left-hand',
  RIGHT_HAND = 'right-hand',
  WRONG_SIGN = 'wrong_sign',
  CONFETTI = 'confetti',
  MUSIC = 'music',
  WRONG_SIGN_ATLAS = 'wrog_sign_atlas',
}

enum AnimationKeys {
  CONFETTI_ANIM = 'confetti_anim',
  MUSIC_ANIM = 'music_anim',
  WRONG_SIGN_ANIM = 'wrong_sign_anim',
}

@Injectable({
  providedIn: 'root',
})
export class BeatBoxerScene extends Phaser.Scene {
  private enabled = false;

  private collisions = false;
  private enableLeft = false;
  private enableRight = false;
  private collisionDetected?: {
    bagType: string;
    gloveColor: 'blue' | 'red';
    result: 'success' | 'failure';
  };
  private poseSubscription: Subscription;
  private results?: Results;

  private music = false;
  private currentFailureTriggerId!: number;
  private currentSuccessTriggerId!: number;
  private genre!: Genre | 'afro';
  currentSet!: number;
  private backtrack!: Howl;
  private successTrack!: Howl;
  private failureTrack!: Howl;
  private backtrackId: number;
  private currentSuccessTrigger = 1;
  private currentFailureTrigger = 1;

  private blueGlove: Phaser.Types.Physics.Arcade.ImageWithStaticBody;
  private redGlove: Phaser.Types.Physics.Arcade.ImageWithStaticBody;
  private wrongSign?: Phaser.Types.Physics.Arcade.ImageWithStaticBody;
  private group: Phaser.Physics.Arcade.StaticGroup;

  private designAssetsLoaded = false;
  private musicFilesLoaded = 0;
  private totalMusicFiles!: number;
  private loadError = false;

  private blueGloveCollisionCallback = async (
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
    // play confetti/wrong animation and music only after the animation is complete
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

  private redGloveCollisionCallback = async (
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

  constructor(private poseModelAdapter: PoseModelAdapter, private ttsService: TtsService) {
    super({ key: 'beatBoxer' });
  }

  preload() {
    this.designAssetsLoaded = false;
    // default scale of desing assets (fine-tuned based on sujit's feedback)
    const heavyBagScale = 1;
    const speedBagScale = 0.8;
    const handOverlayScale = 0.6;
    const obstacleScale = 1.1;

    this.load.atlas(
      TextureKeys.CONFETTI,
      'assets/images/beat-boxer/confetti.png',
      'assets/images/beat-boxer/confetti.json',
    );
    this.load.atlas(
      'music',
      'assets/images/beat-boxer/music.png',
      'assets/images/beat-boxer/music.json',
    );

    this.load.atlas(
      TextureKeys.WRONG_SIGN_ATLAS,
      'assets/images/beat-boxer/wrong_sign.png',
      'assets/images/beat-boxer/wrong_sign.json',
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
      key: TextureKeys.WRONG_SIGN,
      url: 'assets/images/beat-boxer/WRONG_HIT.svg',
      svgConfig: {
        scale: obstacleScale,
      },
    });

    this.load.once('complete', (_id: number, _completed: number, failed: number) => {
      if (failed === 0) {
        this.designAssetsLoaded = true;
      } else {
        console.log('Design Assets Failed to Load', failed);
        this.loadError = true;
      }
    });
  }

  private onLoadCallback = () => {
    this.musicFilesLoaded += 1;
  };

  private onLoadErrorCallback = () => {
    this.loadError = true;
  };

  private checkIfAssetsAreLoaded() {
    return (
      this.totalMusicFiles &&
      this.designAssetsLoaded &&
      this.musicFilesLoaded === this.totalMusicFiles
    );
  }

  async loadAssets(genre: Genre) {
    await this.ttsService.preLoadTts('beat_boxer');
    return new Promise<void>((resolve, reject) => {
      const startTime = new Date().getTime();
      this.loadMusicFiles(genre);
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

  create() {
    // creating confetti and music anims from the sprite sheet texture/atlas.
    this.group = this.physics.add.staticGroup({});

    this.anims.create({
      key: AnimationKeys.CONFETTI_ANIM,
      frames: this.anims.generateFrameNames(TextureKeys.CONFETTI, {
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
      key: AnimationKeys.MUSIC_ANIM,
      frames: this.anims.generateFrameNames(TextureKeys.MUSIC, {
        start: 68,
        end: 121,
        prefix: 'tile0',
        zeroPad: 2,
        suffix: '.png',
      }),
      duration: 1000,
      hideOnComplete: true,
    });

    this.anims.create({
      key: AnimationKeys.WRONG_SIGN_ANIM,
      frames: this.anims.generateFrameNames(TextureKeys.WRONG_SIGN_ATLAS, {
        start: 1,
        end: 3,
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
    this.enableLeftHand();
    this.enableRightHand();
    this.enableCollisionDetection();
    this.poseSubscription = this.poseModelAdapter.getPose().subscribe((results) => {
      this.results = results;
      this.destroyGloves();
      this.drawGloves(results);
    });
  }

  private destroyGloves() {
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
   * @param results Pose results from @mediapipe/.
   * @param position can be left or right (based on the side you want to place the bag).
   * @returns an Object with shoulderX, wristX and maxReach of the user.
   */
  private calculateReach(
    results: Results,
    position: CenterOfMotion,
  ): { shoulderX: number; wristX: number } {
    const width = this.game.canvas.width;

    // if results or results.poseLandmarks are not present.. return default values.
    if (!results || !Array.isArray(results.poseLandmarks)) {
      return {
        wristX: 250,
        shoulderX: width / 2,
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
      const leftWrist = results.poseLandmarks[15];
      return {
        shoulderX: width - leftShoulder.x * width,
        wristX: width - leftWrist.x * width,
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
      const rightWrist = results.poseLandmarks[16];
      return {
        shoulderX: width - rightShoulder.x * width,
        wristX: width - rightWrist.x * width,
      };
    }
    return {
      wristX: 250,
      shoulderX: width / 2,
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

  private midPoint(x1: number, y1: number, x2: number, y2: number) {
    return [(x1 + x2) / 2, (y1 + y2) / 2];
  }

  /**
   * Function to draw hand overlays.
   * @param results pose results
   */
  private drawGloves(results: Results) {
    const { width, height } = this.game.canvas;
    if (!results || !Array.isArray(results.poseLandmarks)) {
      return;
    }
    if (results.poseLandmarks[15] && results.poseLandmarks[19] && this.enableLeft) {
      const leftWrist = results.poseLandmarks[15];
      this.blueGlove = this.physics.add.staticImage(
        width - leftWrist.x * width,
        leftWrist.y * height,
        TextureKeys.LEFT_HAND,
      );
    }
    if (results.poseLandmarks[16] && results.poseLandmarks[20] && this.enableRight) {
      const rightWrist = results.poseLandmarks[16];
      this.redGlove = this.physics.add.staticImage(
        width - rightWrist.x * width,
        rightWrist.y * height,
        TextureKeys.RIGHT_HAND,
      );
    }
  }

  /**
   * @param point the x coordination of the bag position
   * @param level level of the bag
   * @returns it will return `newX` if it is out of bounds.
   */
  private isInBounds(point: number, level: number) {
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
      const { shoulderX, wristX } = this.calculateReach(this.results, centerOfMotion);
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
    if (gameObject) {
      this.group && this.group.add(gameObject);
      this.animateEntry(gameObject);
      gameObject.refreshBody();
    }
  }

  private getCenter(gameObject: Phaser.Types.Physics.Arcade.GameObjectWithBody): [number, number] {
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
      const { shoulderX, wristX } = this.calculateReach(this.results, centerOfMotion);

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
    if (gameObject) {
      this.group && this.group.add(gameObject);
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

  private playConfettiAnim(x: number, y: number) {
    this.add.sprite(x, y, TextureKeys.CONFETTI).play(AnimationKeys.CONFETTI_ANIM);
    this.add.sprite(x, y, TextureKeys.MUSIC).play(AnimationKeys.MUSIC_ANIM);
  }

  private showWrongSign(x: number, y: number) {
    this.add.sprite(x, y, TextureKeys.WRONG_SIGN_ATLAS).play(AnimationKeys.WRONG_SIGN_ANIM);
  }

  /**
   * @param bag bag object to tween.
   */
  private animateEntry(bag: Phaser.Types.Physics.Arcade.ImageWithStaticBody) {
    // chaining tweens
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
  private async animateExit(bag: Phaser.Types.Physics.Arcade.ImageWithStaticBody) {
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

  private getDurationOfNote(note: number) {
    return audioSprites['beatBoxer'][`note_${note}`][1];
  }

  private src: { [key in Genre | 'afro']: string } = {
    classical: 'assets/sounds/soundsprites/beat-boxer/classical/',
    'surprise me!': 'assets/sounds/soundsprites/beat-boxer/ambient/',
    rock: 'assets/sounds/soundsprites/beat-boxer/rock/',
    dance: 'assets/sounds/soundsprites/beat-boxer/dance/',
    jazz: 'assets/sounds/soundsprites/beat-boxer/jazz/',
    afro: 'assets/sounds/soundsprites/beat-boxer/afro/',
  };

  private loadMusicFiles(genre: Genre | 'afro') {
    this.musicFilesLoaded = 0;

    const randomSet = genre === 'classical' ? Math.floor(Math.random() * 2) : 0;
    this.genre = genre;
    this.currentSet = randomSet;

    if (genre === 'classical' && randomSet === 1) {
      this.totalMusicFiles = 2;

      this.failureTrack = new Howl({
        src: 'assets/sounds/soundscapes/Sound Health Soundscape_decalibrate.mp3',
        html5: true,
        onload: this.onLoadCallback,
        onloaderror: this.onLoadErrorCallback,
      });

      this.successTrack = new Howl({
        src: 'assets/sounds/soundsprites/beat-boxer/classical/set1/beatBoxer.mp3',
        sprite: audioSprites.beatBoxer,
        html5: true,
        loop: false,
        onfade: (id) => {
          this.successTrack.stop(id);
        },
        onload: this.onLoadCallback,
        onloaderror: this.onLoadErrorCallback,
      });
      return;
    }

    if (genre === 'afro') {
      const src: string = this.src[genre];
      this.totalMusicFiles = 3;

      this.backtrack = new Howl({
        src: src + `backtracks/afro_backtrack_${randomSet + 1}.mp3`,
        html5: true,
        loop: true,
        volume: 0.5,
        onload: this.onLoadCallback,
        onloaderror: this.onLoadErrorCallback,
      });

      this.failureTrack = new Howl({
        src: src + 'triggers/errorTriggers.mp3',
        sprite: beatBoxerAudio[genre][randomSet].errorTriggers,
        html5: true,
        onload: this.onLoadCallback,
        onloaderror: this.onLoadErrorCallback,
      });

      this.successTrack = new Howl({
        src: src + 'triggers/successTriggers.mp3',
        sprite: beatBoxerAudio[genre][randomSet].successTriggers,
        html5: true,
        onend: (id) => {
          this.successTrack.stop(id);
        },
        onload: this.onLoadCallback,
        onloaderror: this.onLoadErrorCallback,
      });

      return;
    }

    this.totalMusicFiles = 3;
    const src: string = this.src[genre] + `set${randomSet}/`;
    this.backtrack = new Howl({
      src: src + 'backtrack.mp3',
      html5: true,
      loop: true,
      onload: this.onLoadCallback,
      onloaderror: this.onLoadErrorCallback,
    });
    this.successTrack = new Howl({
      src: src + genre + 'Triggers.mp3',
      sprite: beatBoxerAudio[genre][randomSet].successTriggers,
      html5: true,
      onend: (id) => {
        this.successTrack.stop(id);
      },
      onload: this.onLoadCallback,
      onloaderror: this.onLoadErrorCallback,
    });
    this.failureTrack = new Howl({
      src: src + genre + 'Error.mp3',
      sprite: beatBoxerAudio[genre][randomSet].errorTriggers,
      html5: true,
      onend: (id) => {
        this.failureTrack.stop(id);
      },
      onload: this.onLoadCallback,
      onloaderror: this.onLoadErrorCallback,
    });
  }

  playBacktrack() {
    if (this.backtrack && !this.backtrack.playing(this.backtrackId)) {
      this.backtrackId = this.backtrack.play();
    }
    return this.backtrackId;
  }

  stopBacktrack() {
    const endFadeoutDuration = 5000;
    if (this.backtrack && this.backtrackId && this.backtrack.playing(this.backtrackId)) {
      this.backtrack.fade(100, 0, endFadeoutDuration, this.backtrackId).on('fade', (id) => {
        this.backtrack.stop(id);
      });
    }
  }

  private playSuccessMusic() {
    if (this.genre === 'classical' && this.currentSet === 1) {
      const fadeOutDuration = 750;
      const noteDuration = this.getDurationOfNote(this.currentSuccessTrigger);
      const durationBeforeFadeOut = noteDuration - fadeOutDuration;
      console.log('playing piano note, ', this.currentSuccessTrigger);
      this.successTrack.volume(1);
      const successToneId = this.successTrack.play(`note_${this.currentSuccessTrigger}`);
      setTimeout(() => {
        this.successTrack.fade(1, 0, fadeOutDuration, successToneId);
      }, durationBeforeFadeOut);
      this.currentSuccessTrigger += 1;
      if (this.currentSuccessTrigger === 149) {
        this.currentSuccessTrigger = 1;
      }
      return successToneId;
    } else {
      // if (this.successTrack.playing(this.currentSuccessTriggerId)) {
      //   this.successTrack.stop(this.currentSuccessTriggerId);
      // }
      this.currentSuccessTriggerId = this.successTrack.play('trigger' + this.currentSuccessTrigger);
      this.currentSuccessTrigger += 1;
      const totalTriggers = Object.entries(
        beatBoxerAudio[this.genre][this.currentSet].successTriggers,
      ).length;
      if (this.currentSuccessTrigger === totalTriggers + 1) {
        this.currentSuccessTrigger = 1;
      }
      return this.currentSuccessTriggerId;
    }
  }

  private playFailureMusic() {
    if (this.genre === 'classical' && this.currentSet === 1) {
      console.log('playFailureTrack:: classical');
      return this.failureTrack.play();
    } else {
      this.currentFailureTriggerId = this.failureTrack.play('error' + this.currentFailureTrigger);
      this.currentFailureTrigger += 1;
      const totalTriggers = Object.entries(
        beatBoxerAudio[this.genre][this.currentSet].errorTriggers,
      ).length;
      if (this.currentFailureTrigger === totalTriggers + 1) {
        this.currentFailureTrigger = 1;
      }
      return this.currentFailureTriggerId;
    }
  }

  /**
   * @param value default `true`.
   */
  enableMusic(value = true) {
    this.music = value;

    // if disabled... unload music files
    if (!value) {
      this.successTrack && this.successTrack.unload();
      this.failureTrack && this.failureTrack.unload();
      this.backtrack && this.backtrack.unload();
    }
  }
}
