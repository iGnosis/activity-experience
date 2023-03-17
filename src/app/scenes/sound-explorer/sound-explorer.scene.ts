import { Injectable } from '@angular/core';
import { Results } from '@mediapipe/pose';
import { Vector2D } from '@tensorflow-models/posenet/dist/types';
import { Howl } from 'howler';
import { Vector } from 'matter';
import { BehaviorSubject, Subscription } from 'rxjs';
import { PoseModelAdapter } from 'src/app/services/pose-model-adapter/pose-model-adapter.service';
import { soundExporerAudio } from 'src/app/services/sounds/sound-explorer.audiosprite';
import { SoundsService } from 'src/app/services/sounds/sounds.service';
import { TtsService } from 'src/app/services/tts/tts.service';
import { AudioSprite, Genre, Origin, Shape } from 'src/app/types/pointmotion';
import { GameObjectWithBodyAndTexture } from 'src/app/types/pointmotion';

enum TextureKeys {
  CIRCLE = 'circle_shape',
  TRIANGLE = 'triangle_shape',
  SQUARE = 'square_shape',
  WRONG = 'wrong_shape',
  HEXAGON = 'hexagon_shape',
  CONFETTI = 'confetti',
  CONCENTRIC_CIRCLES = 'concentric_circles',
  BURST = 'burst',
}

enum AnimationKeys {
  CONFETTI_ANIM = 'confetti_anim',
  CIRCLES_ANIM = 'circles_anim',
  BURST_ANIM = 'burst_anim',
}

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

  private designAssetsLoaded = false;
  private musicFilesLoaded = 0;
  private totalMusicFiles!: number;
  private loadError = false;
  currentSet!: number;
  private genre: Genre;
  private backtrack: Howl;
  private backtrackId!: number;
  private currentTriggerId!: number;
  private currentTrigger = 1;
  private alto: Howl;
  private soprano: Howl;
  private bass: Howl;
  private tenor: Howl;
  private failureMusic: Howl;
  private altoId: number;
  private sopranoId: number;
  private bassId: number;
  private tenorId: number;
  private failureMusicId: number;

  private collisionCallback = (
    _hand: Phaser.Types.Physics.Arcade.GameObjectWithBody,
    shape: GameObjectWithBodyAndTexture,
  ) => {
    const texture: string = shape.getData('shape');
    if (!texture) return;

    // coordinates to play the success and failure animations
    const [x, y] = this.getCenter(shape);

    // updating the score, if the shape is not X shape.
    if (texture !== 'wrong') {
      this.currentScore += 1;
      console.log('score: ', this.currentScore);
      this.score.next(this.currentScore);

      // play success animation
      this.add.sprite(x, y, TextureKeys.CONFETTI).play(AnimationKeys.CONFETTI_ANIM);
      this.add.sprite(x, y, TextureKeys.CONCENTRIC_CIRCLES).play(AnimationKeys.CIRCLES_ANIM);

      // to play success music based on the shape
      console.log('play successMusic', texture);

      if (this.music) {
        this.playSuccessMusic(texture, this.genre, this.currentSet);
      } else {
        this.soundsService.playCalibrationSound('success');
      }
    } else {
      // play failure animation
      this.score.next(this.currentScore);
      this.add.sprite(x, y, TextureKeys.BURST).play(AnimationKeys.BURST_ANIM);
      if (this.music) {
        this.playFailureMusic();
      } else {
        this.soundsService.playCalibrationSound('error');
      }
    }
    // destroying the shape
    shape.destroy(true);
  };

  constructor(
    private poseModelAdapter: PoseModelAdapter,
    private ttsService: TtsService,
    private soundsService: SoundsService,
  ) {
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
      key: TextureKeys.SQUARE,
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
    await this.ttsService.preLoadTts('sound_explorer');
    return new Promise<void>((resolve, reject) => {
      const startTime = new Date().getTime();

      // as afro music is unavailable, we are using classical music for afro.
      if ((genre as Genre | 'afro') === 'afro') {
        this.loadMusicFiles('jazz');
      } else {
        this.loadMusicFiles(genre);
      }

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

    this.poseSubscription = this.poseModelAdapter.getPose().subscribe((results) => {
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
    this.physics.world.on('worldbounds', (body: Phaser.Physics.Arcade.Body) => {
      body.gameObject.destroy(true);
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
        return TextureKeys.SQUARE;
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
    let pulseColor = 0x00bd3e;

    for (const shape of shapes) {
      if (shape === undefined) return;

      if (shape === 'wrong') {
        shapeScale = 0.048;
        pulseColor = 0xf73636;
      }

      const [originX, originY] = this.getOrigin(origin);
      const textureKey = this.getTextureKey(shape);

      const container = this.add.container(originX, originY);
      container.setSize(64, 64);

      const gameObject = this.add.sprite(0, 0, textureKey).setScale(shapeScale);
      const pulse = this.add.circle(0, 0, 25, pulseColor).setDepth(-1).setAlpha(0.5);
      this.tweens.addCounter({
        from: 1.2,
        to: 2,
        duration: 300,
        repeat: -1,
        yoyo: true,
        onUpdate: (tw) => {
          pulse.setScale(tw.getValue());
        },
      });

      container.add([pulse, gameObject]);
      this.physics.world.enable(container);

      (container.body as Phaser.Physics.Arcade.Body).setCollideWorldBounds(true);
      (container.body as Phaser.Physics.Arcade.Body).onWorldBounds = true;

      // setting data to identify the shape in collisionCallback.
      container.setData('shape', shape);

      console.log('showShapes::gameObject:', gameObject);
      this.group && this.group.add(container);

      if (origin === 'top-left' || origin === 'top-right') {
        // reducing the velocity of shapes falling from top..
        this.physics.velocityFromRotation(
          Phaser.Math.DegToRad(angle),
          velocity - 150,
          container.body.velocity as Phaser.Math.Vector2,
        );
      } else {
        this.physics.velocityFromRotation(
          Phaser.Math.DegToRad(angle),
          velocity + 50,
          container.body.velocity as Phaser.Math.Vector2,
        );
      }
    }

    console.log('group::children:', this.group.getChildren());
  }

  /**
   * @param results Pose Results
   */
  private drawHands(results: Results): void {
    const { width, height } = this.game.canvas;
    if (!results || !Array.isArray(results.poseLandmarks)) {
      return;
    }
    if (results.poseLandmarks[15] && results.poseLandmarks[19] && this.enableLeft) {
      const leftWrist = results.poseLandmarks[15];
      this.leftHand = this.physics.add.existing(
        this.add.circle(width - leftWrist.x * width, leftWrist.y * height, 25, 0xffffff, 0.5),
      );
    }
    if (results.poseLandmarks[16] && results.poseLandmarks[20] && this.enableRight) {
      const rightWrist = results.poseLandmarks[16];
      this.rightHand = this.physics.add.existing(
        this.add.circle(width - rightWrist.x * width, rightWrist.y * height, 25, 0xffffff, 0.5),
      );
    }
  }

  /**
   * @returns midpoint of (x1, y1) and (x2, y2).
   */
  private midPoint(x1: number, y1: number, x2: number, y2: number) {
    return [(x1 + x2) / 2, (y1 + y2) / 2];
  }

  private getOrigin(type: Origin): [number, number] {
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

  private src: { [key in Genre]: string[] } = {
    classical: ['assets/sounds/soundsprites/sound-explorer/classical/set1/'],
    'surprise me!': ['assets/sounds/soundsprites/sound-explorer/ambient/set1/'],
    rock: ['assets/sounds/soundsprites/sound-explorer/rock/set1/'],
    dance: ['assets/sounds/soundsprites/sound-explorer/dance/set1/'],
    jazz: ['assets/sounds/soundsprites/sound-explorer/jazz/set1/'],
  };

  private loadMusicFiles(genre: Genre) {
    this.musicFilesLoaded = 0;
    const randomSet = genre === 'classical' ? Math.floor(Math.random() * 2) : 0;
    this.genre = genre;
    this.currentSet = randomSet;

    // common for all genres
    this.failureMusic = new Howl({
      src: 'assets/sounds/soundscapes/Sound Health Soundscape_decalibrate.mp3',
      html5: true,
      onload: this.onLoadCallback,
      onloaderror: this.onLoadErrorCallback,
    });

    /**
     * classical set1 is different form rest of the sound-explorer music sets.
     * classical set1 has 4 subsets.. Bass, Tenor, Soprano, Alto. Each subset has 17 notes.
     * Each shape is mapped with each subset.
     * Circle --> Bass, Triangle --> Tenor,  Square/Rect --> Soprano, Hexagon --> Alto.
     * whenever a shape is hit a note from it's corresponding subset will be played.
     */
    if (genre === 'classical' && randomSet === 1) {
      this.totalMusicFiles = 5;

      this.alto = new Howl({
        src: 'assets/sounds/soundsprites/sound-explorer/classical/set2/Alto.mp3',
        sprite: soundExporerAudio.classical[1].alto as AudioSprite,
        html5: true,
        onload: this.onLoadCallback,
        onloaderror: this.onLoadErrorCallback,
        onend: (id) => {
          this.alto.stop(id);
        },
      });
      this.bass = new Howl({
        src: 'assets/sounds/soundsprites/sound-explorer/classical/set2/Bass.mp3',
        sprite: soundExporerAudio.classical[1].bass as AudioSprite,
        html5: true,
        onload: this.onLoadCallback,
        onloaderror: this.onLoadErrorCallback,
        onend: (id) => {
          this.bass.stop(id);
        },
      });
      this.soprano = new Howl({
        src: 'assets/sounds/soundsprites/sound-explorer/classical/set2/Soprano.mp3',
        sprite: soundExporerAudio.classical[1].soprano as AudioSprite,
        html5: true,
        onload: this.onLoadCallback,
        onloaderror: this.onLoadErrorCallback,
        onend: (id) => {
          this.soprano.stop(id);
        },
      });
      this.tenor = new Howl({
        src: 'assets/sounds/soundsprites/sound-explorer/classical/set2/Tenor.mp3',
        sprite: soundExporerAudio.classical[1].tenor as AudioSprite,
        html5: true,
        onload: this.onLoadCallback,
        onloaderror: this.onLoadErrorCallback,
        onend: (id) => {
          this.tenor.stop(id);
        },
      });
      return;
    }

    this.totalMusicFiles = 6;
    const src = this.src[genre][randomSet];

    this.backtrack = new Howl({
      src: src + 'backtrack.mp3',
      loop: true,
      html5: true,
      onload: this.onLoadCallback,
      onloaderror: this.onLoadErrorCallback,
    });

    this.alto = new Howl({
      src: src + 'Alto.mp3',
      sprite: soundExporerAudio[genre][randomSet].alto,
      html5: true,
      onload: this.onLoadCallback,
      onloaderror: this.onLoadErrorCallback,
      onend: (id) => {
        this.alto.stop(id);
      },
    });
    this.bass = new Howl({
      src: src + 'Bass.mp3',
      sprite: soundExporerAudio[genre][randomSet].bass,
      html5: true,
      onload: this.onLoadCallback,
      onloaderror: this.onLoadErrorCallback,
      onend: (id) => {
        this.bass.stop(id);
      },
    });
    this.soprano = new Howl({
      src: src + 'Soprano.mp3',
      sprite: soundExporerAudio[genre][randomSet].soprano,
      html5: true,
      onload: this.onLoadCallback,
      onloaderror: this.onLoadErrorCallback,
      onend: (id) => {
        this.soprano.stop(id);
      },
    });
    this.tenor = new Howl({
      src: src + 'Tenor.mp3',
      sprite: soundExporerAudio[genre][randomSet].tenor,
      html5: true,
      onload: this.onLoadCallback,
      onloaderror: this.onLoadErrorCallback,
      onend: (id) => {
        this.tenor.stop(id);
      },
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

  setNextNote() {
    this.currentNote += 1;
    // the chords only have 16 notes.. so resetting it to 1 when the value moves past 16.
    if (this.currentNote === 17) {
      this.resetNotes();
    }
  }

  resetNotes() {
    this.currentNote = 1;
  }

  private playSuccessMusic(textureKey: string, genre: Genre, set: number) {
    if (textureKey === TextureKeys.CIRCLE) {
      this.playChord('bass');
    } else if (textureKey === TextureKeys.TRIANGLE) {
      this.playChord('tenor');
    } else if (textureKey === TextureKeys.SQUARE) {
      this.playChord('alto');
    } else if (textureKey === TextureKeys.HEXAGON) {
      this.playChord('soprano');
    }
  }

  private playChord(type: 'alto' | 'bass' | 'soprano' | 'tenor'): void {
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

  private playFailureMusic() {
    if (!this.failureMusic) {
      return;
    }
    return this.failureMusic.play();
  }

  /**
   * @param value default `true`.
   */
  enableMusic(value = true) {
    this.music = value;

    // unload all music, when music is disabled. This is to prevent the audiopool from being exhausted.
    if (!value) {
      this.soprano && this.soprano.unload();
      this.tenor && this.tenor.unload();
      this.alto && this.alto.unload();
      this.bass && this.bass.unload();
      this.failureMusic && this.failureMusic.unload();
      this.backtrack && this.backtrack.unload();
    }
  }
}
