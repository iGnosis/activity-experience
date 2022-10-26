import { Injectable } from '@angular/core';
import { Results } from '@mediapipe/pose';
import { Howl } from 'howler';
import { BehaviorSubject, Subscription } from 'rxjs';
import { PoseService } from 'src/app/services/pose/pose.service';
import { audioSprites } from 'src/app/services/sounds/audio-sprites';
import { TtsService } from 'src/app/services/tts/tts.service';

export enum TextureKeys {
  CIRCLE = 'circle_shape',
  TRIANGLE = 'triangle_shape',
  RECTANGLE = 'rectangle_shape',
  WRONG = 'wrong_shape',
  HEXAGON = 'hexagon_shape',
  CONFETTI = 'confetti',
  CONCENTRIC_CIRCLES = 'concentric_circles',
  BURST = 'burst',
}
export enum AnimationKeys {
  CONFETTI_ANIM = 'confetti_anim',
  CIRCLES_ANIM = 'circles_anim',
  BURST_ANIM = 'burst_anim',
}
export type Shape = 'circle' | 'triangle' | 'rectangle' | 'wrong' | 'hexagon';
export type Origin =
  | 'bottom-right'
  | 'bottom-left'
  | 'bottom-center'
  | 'left-center'
  | 'right-center'
  | 'top-left'
  | 'top-right';

export type GameObjectWithBodyAndTexture = Phaser.GameObjects.GameObject & {
  body: Phaser.Physics.Arcade.Body | Phaser.Physics.Arcade.StaticBody;
  texture?: {
    key: string;
  };
};

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
  private currentScore = 0;
  score = new BehaviorSubject<number>(0);
  private group: Phaser.Physics.Arcade.Group;
  private leftHand: Phaser.GameObjects.Arc;
  private rightHand: Phaser.GameObjects.Arc;
  private currentNote = 1;
  private music = false;

  designAssetsLoaded = false;
  musicFilesLoaded = 0;
  totalMusicFiles = 5;
  loadError = false;

  private collisionCallback = (
    _hand: Phaser.Types.Physics.Arcade.GameObjectWithBody,
    _shape: GameObjectWithBodyAndTexture,
  ) => {
    if (!_shape.texture) return;

    // coordinates to play the success and failure animations
    const [x, y] = this.getCenter(_shape);

    // updating the score, if the shape is not X shape.
    if (!(_shape.texture.key === TextureKeys.WRONG)) {
      this.currentScore += 1;
      console.log('score: ', this.currentScore);
      this.score.next(this.currentScore);

      // play success animation
      this.add.sprite(x, y, TextureKeys.CONFETTI).play(AnimationKeys.CONFETTI_ANIM);
      this.add.sprite(x, y, TextureKeys.CONCENTRIC_CIRCLES).play(AnimationKeys.CIRCLES_ANIM);

      // to play success music based on the shape
      console.log('play successMusic', _shape.texture.key);

      if (!this.music) return;

      if (this.music) {
        if (_shape.texture.key === TextureKeys.CIRCLE) {
          this.playSuccessMusic('bass');
        } else if (_shape.texture.key === TextureKeys.TRIANGLE) {
          this.playSuccessMusic('tenor');
        } else if (_shape.texture.key === TextureKeys.RECTANGLE) {
          this.playSuccessMusic('alto');
        } else if (_shape.texture.key === TextureKeys.HEXAGON) {
          this.playSuccessMusic('soprano');
        }
      }
    } else {
      // play failure animation
      this.add.sprite(x, y, TextureKeys.BURST).play(AnimationKeys.BURST_ANIM);
      this.music && this.playFailureMusic();
    }
    // destroying the shape
    _shape.destroy(true);
  };

  constructor(private poseService: PoseService, private ttsService: TtsService) {
    super({ key: 'soundExplorer' });
    this.score.subscribe((score) => (this.currentScore = score));
  }

  preload() {
    this.designAssetsLoaded = false;

    // preloading design assets
    this.load.image({
      key: TextureKeys.CIRCLE,
      url: 'assets/images/sound-slicer/Circle shape.png',
    });

    this.load.image({
      key: TextureKeys.RECTANGLE,
      url: 'assets/images/sound-slicer/Rectangle shape.png',
    });

    this.load.image({
      key: TextureKeys.TRIANGLE,
      url: 'assets/images/sound-slicer/Triangle shape.png',
    });

    this.load.image({
      key: TextureKeys.WRONG,
      url: 'assets/images/sound-slicer/Wrong shape.png',
    });

    this.load.image({
      key: TextureKeys.HEXAGON,
      url: 'assets/images/sound-slicer/Hexagon shape.png',
    });

    // loading animation assets
    this.load.atlas(
      TextureKeys.CONFETTI,
      'assets/images/beat-boxer/confetti.png',
      'assets/images/beat-boxer/confetti.json',
    );
    this.load.atlas(
      TextureKeys.CONCENTRIC_CIRCLES,
      'assets/images/sound-slicer/circles.png',
      'assets/images/sound-slicer/circles.json',
    );
    this.load.atlas(
      TextureKeys.BURST,
      'assets/images/sound-slicer/burst.png',
      'assets/images/sound-slicer/burst.json',
    );

    this.load.once('complete', (_id: any, _completed: number, failed: number) => {
      // no game asset is failed.
      if (failed === 0) {
        this.designAssetsLoaded = true;
      } else {
        console.log('Design Assets Failed to Load::', failed);
        this.loadError = true;
      }
    });

    this.failureMusic = new Howl({
      src: 'assets/sounds/soundscapes/Sound Health Soundscape_decalibrate.mp3',
      html5: true,
      onload: this.onLoadCallback,
      onloaderror: this.onLoadErrorCallback,
    });
    this.alto = new Howl({
      src: 'assets/sounds/soundsprites/sound-explorer/piano/Alto.mp3',
      sprite: audioSprites.soundExplorer.alto,
      html5: true,
      onload: this.onLoadCallback,
      onloaderror: this.onLoadErrorCallback,
    });
    this.bass = new Howl({
      src: 'assets/sounds/soundsprites/sound-explorer/piano/Bass.mp3',
      sprite: audioSprites.soundExplorer.bass,
      html5: true,
      onload: this.onLoadCallback,
      onloaderror: this.onLoadErrorCallback,
    });
    this.soprano = new Howl({
      src: 'assets/sounds/soundsprites/sound-explorer/piano/Soprano.mp3',
      sprite: audioSprites.soundExplorer.soprano,
      html5: true,
      onload: this.onLoadCallback,
      onloaderror: this.onLoadErrorCallback,
    });
    this.tenor = new Howl({
      src: 'assets/sounds/soundsprites/sound-explorer/piano/Tenor.mp3',
      sprite: audioSprites.soundExplorer.tenor,
      html5: true,
      onload: this.onLoadCallback,
      onloaderror: this.onLoadErrorCallback,
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

  async loadAssets() {
    await this.ttsService.preLoadTts('sound_explorer');
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
    // alert('sound explorer scene enabled');
    this.enabled = true;
    this.enableCollisionDetection();
    this.enableLeftHand();
    this.enableRightHand();

    this.poseSubscription = this.poseService.getPose().subscribe((results) => {
      // this.results = results;
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

    // creating a group.
    this.group = this.physics.add.group({
      collideWorldBounds: true,
      gravityY: 40,
    });

    this.anims.create({
      key: AnimationKeys.CONFETTI_ANIM,
      frames: this.anims.generateFrameNames(TextureKeys.CONFETTI, {
        start: 1,
        end: 30,
        prefix: 'tile0',
        zeroPad: 2,
        suffix: '.png',
      }),
      duration: 1000,
      repeat: 0,
      hideOnComplete: true,
    });

    this.anims.create({
      key: AnimationKeys.CIRCLES_ANIM,
      frames: this.anims.generateFrameNames(TextureKeys.CONCENTRIC_CIRCLES, {
        start: 4,
        end: 36,
        prefix: 'tile0',
        zeroPad: 2,
        suffix: '.png',
      }),
      duration: 1000,
      repeat: 0,
      hideOnComplete: true,
    });

    this.anims.create({
      key: AnimationKeys.BURST_ANIM,
      frames: this.anims.generateFrameNames(TextureKeys.BURST, {
        start: 7,
        end: 43,
        prefix: 'tile0',
        zeroPad: 2,
        suffix: '.png',
      }),
      duration: 1000,
      repeat: 0,
      hideOnComplete: true,
    });

    // setting world bounds and enabling collisions.
    this.physics.world.setBounds(0, 0, width, height, true, true, true, true);

    // event listener for 'worldbounds', triggers when any gameObject with collideWorldBounds set to true is collided with world bounds.
    this.physics.world.on('worldbounds', (_body: Phaser.Physics.Arcade.Body) => {
      console.log(_body);
      _body.gameObject.destroy(true);
      console.log(this.group.getLength());
    });
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

  private getCenter(gameObject: Phaser.Types.Physics.Arcade.GameObjectWithBody): [number, number] {
    return [
      (gameObject.body.right + gameObject.body.left) / 2,
      (gameObject.body.top + gameObject.body.bottom) / 2,
    ];
  }

  private getTextureKey(shape: Shape): string {
    switch (shape) {
      case 'circle':
        return TextureKeys.CIRCLE;
      case 'rectangle':
        return TextureKeys.RECTANGLE;
      case 'triangle':
        return TextureKeys.TRIANGLE;
      case 'wrong':
        return TextureKeys.WRONG;
      case 'hexagon':
        return TextureKeys.HEXAGON;
    }
  }

  /**
   * @param shapes an array of shapes
   * @param origin Origin point of the shapes
   * @param angle Angle at which the shapes should be thrown
   * @param velocity Velocity of the shapes
   */
  showShapes(shapes: Shape[], origin: Origin, angle: number, velocity: number) {
    if (!this.group) return;
    let shapeScale = 0.04;

    // this.setNextNote();

    // const velocityX = velocity * Math.cos(angle);
    // const velocityY = -velocity * Math.sin(angle);
    for (const shape of shapes) {
      if (shape === 'wrong') {
        shapeScale = 0.048;
      }

      const [originX, originY] = this.getOrigin(origin);
      const textureKey = this.getTextureKey(shape);

      console.log('OriginPoint::x:', originX);
      console.log('OriginPoint::y:', originY);

      const gameObject = this.physics.add.sprite(originX, originY, textureKey).setScale(shapeScale);
      // console.log('showShapes::gameObject:', gameObject);
      gameObject.body.onWorldBounds = true;
      this.group && this.group.add(gameObject);

      if (origin === 'top-left' || origin === 'top-right') {
        // reducing the velocity of shapes falling from top..
        this.physics.velocityFromRotation(
          Phaser.Math.DegToRad(angle),
          velocity - 150,
          gameObject.body.velocity,
        );
      } else {
        this.physics.velocityFromRotation(
          Phaser.Math.DegToRad(angle),
          velocity + 50,
          gameObject.body.velocity,
        );
      }
    }

    console.log('group::children:', this.group.getChildren());
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

  getOrigin(type: Origin): [number, number] {
    const { width, height } = this.game.canvas;
    // adding some randomness so that the shapes won't overlap completely.
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

  waitForCollisionOrTimeout(timeout?: number) {
    return new Promise((resolve) => {
      const startTime = new Date().getTime();
      const interval = setInterval(() => {
        // if timeout...
        if (timeout && new Date().getTime() - startTime > timeout) {
          resolve({});
          clearInterval(interval);
        }
        // if collision detected...
        if (this.group.getLength() === 0) {
          resolve({});
          clearInterval(interval);
        }
      }, 300);
    });
  }

  setNextNote() {
    if (this.currentNote === 16) {
      this.currentNote = 1;
    } else {
      this.currentNote += 1;
    }
  }

  resetNotes() {
    this.currentNote = 1;
  }

  alto: Howl;
  soprano: Howl;
  bass: Howl;
  tenor: Howl;
  failureMusic: Howl;
  altoId: number;
  sopranoId: number;
  bassId: number;
  tenorId: number;
  failureMusicId: number;

  playSuccessMusic(type: 'alto' | 'bass' | 'soprano' | 'tenor'): void {
    switch (type) {
      case 'alto':
        if (this.alto && this.alto.playing(this.altoId)) {
          this.alto.stop();
        }
        if (this.alto && !this.alto.playing(this.altoId)) {
          this.altoId = this.alto.play(`Alto_${this.currentNote}`);
        }
        break;
      case 'bass':
        if (this.bass && this.bass.playing(this.bassId)) {
          this.bass.stop();
        }
        if (this.bass && !this.bass.playing(this.bassId)) {
          this.bassId = this.bass.play(`Bass_${this.currentNote}`);
        }
        break;
      case 'soprano':
        if (this.soprano && this.soprano.playing(this.sopranoId)) {
          this.soprano.stop();
        }
        if (this.soprano && !this.soprano.playing(this.sopranoId)) {
          this.sopranoId = this.soprano.play(`Soprano_${this.currentNote}`);
        }
        break;
      case 'tenor':
        if (this.tenor && this.tenor.playing(this.tenorId)) {
          this.tenor.stop();
        }
        if (this.tenor && !this.tenor.playing(this.tenorId)) {
          this.tenorId = this.tenor.play(`Tenor_${this.currentNote}`);
        }
        break;
    }
  }

  playFailureMusic(): void {
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
