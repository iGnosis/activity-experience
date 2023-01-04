import { Injectable } from '@angular/core';
import { Results } from '@mediapipe/pose';
import { Howl } from 'howler';
import { BehaviorSubject, distinctUntilChanged, Subject, Subscription, take } from 'rxjs';
import { HandTrackerService } from 'src/app/services/classifiers/hand-tracker/hand-tracker.service';
import { PoseModelAdapter } from 'src/app/services/pose-model-adapter/pose-model-adapter.service';
import { soundExporerAudio } from 'src/app/services/sounds/sound-explorer.audiosprite';
import { TtsService } from 'src/app/services/tts/tts.service';
import {
  AudioSprite,
  Coordinate,
  GameObjectWithBodyAndTexture,
  MovingTonesTweenData,
  MovingTonesCircle as Circle,
  MovingTonesCircleEvent as CircleEvent,
  MovingTonesCircleSettings,
  MovingTonesCircleData,
} from 'src/app/types/pointmotion';

enum TextureKeys {
  RED_CIRCLE = 'red_circle',
  BLUE_CIRCLE = 'blue_circle',
  MUSIC_CIRCLE = 'music_circle',
  BLUE_DONE = 'blue_done',
  RED_DONE = 'red_done',
  RED_RIPPLE = 'red_ripple',
  BLUE_RIPPLE = 'blue_ripple',
  GREEN_BUBBLES = 'green_bubbles',
  GREEN_RIPPLE = 'green_ripple',
  GREEN_BLAST = 'green_blast',
  LEFT_HAND = 'left-hand',
  RIGHT_HAND = 'right-hand',
}

enum AnimationKeys {
  RED_RIPPLE_ANIM = 'red_ripple_anim',
  BLUE_RIPPLE_ANIM = 'blue_ripple_anim',
  GREEN_BUBBLES_ANIM = 'green_bubbles_anim',
  GREEN_RIPPLE_ANIM = 'green_ripple_anim',
  GREEN_BLAST_ANIM = 'green_blast_anim',
}

@Injectable({
  providedIn: 'root',
})
export class MovingTonesScene extends Phaser.Scene {
  private enableLeft = false;
  private enableRight = false;
  private collisions = false;
  private leftHand: Phaser.Types.Physics.Arcade.ImageWithStaticBody;
  private rightHand: Phaser.Types.Physics.Arcade.ImageWithStaticBody;
  private enabled = false;
  private poseSubscription: Subscription;
  private music = false;
  private alto: Howl;
  private soprano: Howl;
  private bass: Howl;
  private tenor: Howl;
  private failureMusic: Howl;
  private holdSuccessMusic: Howl;
  private holdEntrySound: Howl;
  private greenEntrySound: Howl;
  private holdSound: Howl;
  private altoId: number;
  private sopranoId: number;
  private bassId: number;
  private tenorId: number;
  private failureMusicId: number;
  private group: Phaser.Physics.Arcade.StaticGroup;
  private currentNote = 1;

  score = new BehaviorSubject<number>(0);

  private designAssetsLoaded = false;
  private musicFilesLoaded = 0;
  private totalMusicFiles = 9;
  private loadError = false;

  private isBlueHeld = false;
  private isRedHeld = false;

  blueHoldState = new Subject<boolean>();
  redHoldState = new Subject<boolean>();
  circleScale = 0.6;
  allowClosedHandsWhileHoldingPose = false;
  allowClosedHandsDuringCollision = false;
  circleEvents = new Subject<CircleEvent>();

  private redTween: MovingTonesTweenData = {
    stoppedAt: undefined,
    remainingDuration: undefined,
    totalTimeElapsed: 0,
  };

  private blueTween: MovingTonesTweenData = {
    stoppedAt: undefined,
    remainingDuration: undefined,
    totalTimeElapsed: 0,
  };

  private musicTypes = ['alto', 'soprano', 'tenor', 'bass'];

  private collisionCallback = (
    hand: GameObjectWithBodyAndTexture,
    gameObject: GameObjectWithBodyAndTexture,
  ) => {
    if (!gameObject.texture || !hand.texture) return;
    let pathNumber = 0;

    const gameObjectTexture = gameObject.texture.key;
    const handTexture = hand.texture.key;

    if (
      (handTexture === TextureKeys.RIGHT_HAND && gameObjectTexture === TextureKeys.RED_CIRCLE) ||
      (handTexture === TextureKeys.LEFT_HAND && gameObjectTexture === TextureKeys.BLUE_CIRCLE)
    ) {
      const type: 'start' | 'end' | undefined = gameObject.getData('type');
      if (type === 'end' && this.checkIfStartCircleExists(this.group, gameObjectTexture)) {
        return;
      }

      const [color, startFromBeginning]: [number, boolean] = gameObject.getData([
        'color',
        'startFromBeginning',
      ]);

      let handHeld = handTexture === TextureKeys.RIGHT_HAND ? this.isRedHeld : this.isBlueHeld;

      const handSubscription = this.handTrackerService.openHandStatus
        .pipe(distinctUntilChanged())
        .subscribe((status) => {
          if (!status) return;

          const isHandClosed = handHeld && ![handTexture, 'both-hands'].includes(status);
          if (!this.allowClosedHandsWhileHoldingPose && isHandClosed) {
            handHeld = false;
            if (handTexture === TextureKeys.RIGHT_HAND) {
              this.isRedHeld = false;
              if (type === 'start') this.redHoldState.next(false);
            } else {
              this.isBlueHeld = false;
              if (type === 'start') this.blueHoldState.next(false);
            }
          }

          const isHandHeld =
            handHeld === false &&
            (this.allowClosedHandsWhileHoldingPose || [handTexture, 'both-hands'].includes(status));

          if (isHandHeld) {
            this.setHeldState(handTexture, true);

            const data: MovingTonesCircleData = gameObject.getData('data');
            if (type === 'start') {
              this.getHoldStateSubscription(handTexture).next(true);
            }

            this.circleEvents.next({ name: 'collisionStarted', circle: data.circle });

            let holdDuration = 2500;
            if (data.collisionDebounce) {
              holdDuration = data.collisionDebounce;
            }

            const { x, y } = gameObject.body.center;
            const circleRadius = (gameObject.body.right - gameObject.body.left) / 2;

            const { remainingDuration, stoppedAt } = this.getTween(handTexture);
            const { tween, graphics } =
              remainingDuration === undefined || stoppedAt === undefined
                ? this.animateHeld(x, y, circleRadius, color, 0, holdDuration)
                : this.animateHeld(x, y, circleRadius, color, stoppedAt, remainingDuration);

            tween.on('update', (tween: Phaser.Tweens.Tween) => {
              if (!this.getHeldState(handTexture)) {
                this.circleEvents.next({
                  name: 'collisionEnded',
                  circle: data.circle,
                });

                if (startFromBeginning) {
                  graphics.destroy(true);
                  tween.remove();
                  // remove circles if interrupted when holding the start circles
                  if (type === 'start') {
                    this.destroyGameObjects('allExceptStartCircle', gameObjectTexture);
                  }
                  this.setTweenData(handTexture, {
                    remainingDuration: undefined,
                    stoppedAt: undefined,
                    totalTimeElapsed: 0,
                  });
                } else {
                  this.setTweenData(handTexture, {
                    stoppedAt: tween.getValue(),
                    remainingDuration: tween.duration - tween.elapsed,
                    totalTimeElapsed: this.getTween(handTexture).totalTimeElapsed + tween.elapsed,
                  });
                  graphics.destroy(true);
                  tween.remove();
                }
              } else {
                if (type === 'start') {
                  if (!data.path) return;
                  const { path } = data;
                  const stepDuration = holdDuration / (path.length + 1);
                  const alreadyShown: Circle[] = [];
                  if (tween.elapsed >= stepDuration * (pathNumber + 1)) {
                    if (path[pathNumber] && !alreadyShown.includes(path[pathNumber])) {
                      alreadyShown.push(path[pathNumber]);
                      this.showGreenCircle(path[pathNumber]);
                      pathNumber += 1;
                    }
                  }
                }
              }
            });

            tween.once('complete', () => {
              this.circleEvents.next({ name: 'collisionCompleted', circle: data.circle });
              if (type === 'start') {
                if (data.end) {
                  this.showCirlce(data.end, 'end', {
                    collisionDebounce: holdDuration,
                    circle: data.end,
                  });
                }
              }
              this.setTweenData(handTexture, {
                remainingDuration: undefined,
                stoppedAt: undefined,
                totalTimeElapsed: 0,
              });

              graphics.destroy(true);
              tween.remove();
              gameObject.destroy(true);

              if (type === 'start') {
                const endTexture =
                  handTexture === TextureKeys.RIGHT_HAND
                    ? TextureKeys.RED_DONE
                    : TextureKeys.BLUE_DONE;
                const sprite = this.add.sprite(x, y, endTexture).setScale(this.circleScale);
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
                const color = handTexture === TextureKeys.RIGHT_HAND ? 'red' : 'blue';
                this.animate(x, y, color);
              }
            });
          }
        });
      handSubscription.unsubscribe();
    }

    if (gameObjectTexture === TextureKeys.MUSIC_CIRCLE) {
      const interactableTexture =
        handTexture === TextureKeys.RIGHT_HAND ? TextureKeys.RED_CIRCLE : TextureKeys.BLUE_CIRCLE;
      const startCirclesExist = this.checkIfStartCircleExists(this.group, interactableTexture);
      if (startCirclesExist) return;

      const handSubscription = this.handTrackerService.openHandStatus
        .pipe(distinctUntilChanged())
        .subscribe((status) => {
          const circle: Circle = gameObject.getData('circle');
          this.circleEvents.next({ name: 'collisionStarted', circle });

          if (!status) return;
          if (
            this.allowClosedHandsDuringCollision ||
            [handTexture, 'both-hands'].includes(status)
          ) {
            const interactableWith: 'red' | 'blue' = gameObject.getData('interactableWith');
            const color = handTexture === TextureKeys.RIGHT_HAND ? 'red' : 'blue';
            if (interactableWith !== color) {
              this.score.next(-1);
              this.circleEvents.next({ name: 'invalidCollision', circle });
              return;
            } else {
              this.score.next(1);
            }
            const rippleAnim: Phaser.GameObjects.Sprite = gameObject.getData('rippleAnim');
            rippleAnim.destroy(true);

            const { x, y } = gameObject.body.center;
            this.playSuccessMusic(Phaser.Utils.Array.GetRandom(this.musicTypes));
            gameObject.destroy(true);

            this.circleEvents.next({ name: 'collisionCompleted', circle });
            this.animate(x, y, 'green');
          }
        });
      handSubscription.unsubscribe();
    }
  };

  getTween(texture: TextureKeys.RIGHT_HAND | TextureKeys.LEFT_HAND) {
    if (texture === TextureKeys.RIGHT_HAND) {
      return this.redTween;
    } else {
      return this.blueTween;
    }
  }

  setTweenData(
    texture: TextureKeys.RIGHT_HAND | TextureKeys.LEFT_HAND,
    data: MovingTonesTweenData,
  ) {
    if (texture === TextureKeys.RIGHT_HAND) {
      this.redTween = data;
    } else {
      this.blueTween = data;
    }
  }

  setHeldState(texture: TextureKeys.RIGHT_HAND | TextureKeys.LEFT_HAND, val: boolean) {
    if (texture === TextureKeys.RIGHT_HAND) {
      this.isRedHeld = val;
    } else {
      this.isBlueHeld = val;
    }
  }

  getHeldState(texture: TextureKeys.RIGHT_HAND | TextureKeys.LEFT_HAND) {
    if (texture === TextureKeys.RIGHT_HAND) {
      return this.isRedHeld;
    } else {
      return this.isBlueHeld;
    }
  }

  getHoldStateSubscription(texture: TextureKeys.RIGHT_HAND | TextureKeys.LEFT_HAND) {
    if (TextureKeys.RIGHT_HAND) {
      return this.redHoldState;
    } else {
      return this.blueHoldState;
    }
  }

  private onLoadCallback = () => {
    this.musicFilesLoaded += 1;
  };

  private onLoadErrorCallback = () => {
    this.loadError = true;
  };

  constructor(
    private ttsService: TtsService,
    private poseModelAdapter: PoseModelAdapter,
    private handTrackerService: HandTrackerService,
  ) {
    super({ key: 'movingTones' });
  }

  preload() {
    this.load.svg({
      key: TextureKeys.LEFT_HAND,
      url: 'assets/images/beat-boxer/HAND_OVERLAY_LEFT.svg',
      svgConfig: {
        scale: 0.5,
      },
    });
    this.load.svg({
      key: TextureKeys.RIGHT_HAND,
      url: 'assets/images/beat-boxer/HAND_OVERLAY_RIGHT.svg',
      svgConfig: {
        scale: 0.5,
      },
    });

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
      TextureKeys.BLUE_RIPPLE,
      'assets/images/moving-tones/spritesheets/blue-ripple.png',
      'assets/images/moving-tones/spritesheets/blue-ripple.json',
    );

    this.load.atlas(
      TextureKeys.RED_RIPPLE,
      'assets/images/moving-tones/spritesheets/red-ripple.png',
      'assets/images/moving-tones/spritesheets/red-ripple.json',
    );
    this.load.atlas(
      TextureKeys.GREEN_RIPPLE,
      'assets/images/moving-tones/spritesheets/green-ripple.png',
      'assets/images/moving-tones/spritesheets/green-ripple.json',
    );

    this.load.atlas(
      TextureKeys.GREEN_BUBBLES,
      'assets/images/moving-tones/spritesheets/green-bubble.png',
      'assets/images/moving-tones/spritesheets/green-bubble.json',
    );
    this.load.atlas(
      TextureKeys.GREEN_BLAST,
      'assets/images/moving-tones/spritesheets/green-blast.png',
      'assets/images/moving-tones/spritesheets/green-blast.json',
    );

    this.load.once('complete', (_id: any, _completed: number, failed: number) => {
      if (failed === 0) {
        this.designAssetsLoaded = true;
      } else {
        console.log('Design Assets Failed to Load', failed);
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
      src: 'assets/sounds/soundsprites/sound-explorer/classical/set2/Alto.mp3',
      sprite: soundExporerAudio.classical[1].alto as AudioSprite,
      html5: true,
      onload: this.onLoadCallback,
      onloaderror: this.onLoadErrorCallback,
    });
    this.bass = new Howl({
      src: 'assets/sounds/soundsprites/sound-explorer/classical/set2/Bass.mp3',
      sprite: soundExporerAudio.classical[1].bass as AudioSprite,
      html5: true,
      onload: this.onLoadCallback,
      onloaderror: this.onLoadErrorCallback,
    });
    this.soprano = new Howl({
      src: 'assets/sounds/soundsprites/sound-explorer/classical/set2/Soprano.mp3',
      sprite: soundExporerAudio.classical[1].soprano as AudioSprite,
      html5: true,
      onload: this.onLoadCallback,
      onloaderror: this.onLoadErrorCallback,
    });
    this.tenor = new Howl({
      src: 'assets/sounds/soundsprites/sound-explorer/classical/set2/Tenor.mp3',
      sprite: soundExporerAudio.classical[1].tenor as AudioSprite,
      html5: true,
      onload: this.onLoadCallback,
      onloaderror: this.onLoadErrorCallback,
    });
    this.holdSuccessMusic = new Howl({
      src: 'assets/sounds/soundscapes/Sound Health Soundscape_calibrated.mp3',
      html5: true,
      onload: this.onLoadCallback,
      onloaderror: this.onLoadErrorCallback,
    });
    this.holdEntrySound = new Howl({
      src: 'assets/images/moving-tones/music/hold_entry_sound.mp3',
      html5: true,
      onload: this.onLoadCallback,
      onloaderror: this.onLoadErrorCallback,
    });

    this.holdSound = new Howl({
      src: 'assets/images/moving-tones/music/hold_sound.mp3',
      html5: true,
      onload: this.onLoadCallback,
      onloaderror: this.onLoadErrorCallback,
    });

    this.greenEntrySound = new Howl({
      src: 'assets/images/moving-tones/music/green_entry_sound.mp3',
      html5: true,
      onload: this.onLoadCallback,
      onloaderror: this.onLoadErrorCallback,
    });
  }

  create() {
    this.group = this.physics.add.staticGroup({});

    this.anims.create({
      key: AnimationKeys.RED_RIPPLE_ANIM,
      frames: this.anims.generateFrameNames(TextureKeys.RED_RIPPLE, {
        start: 5,
        end: 35,
        prefix: 'tile0',
        zeroPad: 2,
        suffix: '.png',
      }),
      duration: 1000,
      hideOnComplete: true,
    });

    this.anims.create({
      key: AnimationKeys.BLUE_RIPPLE_ANIM,
      frames: this.anims.generateFrameNames(TextureKeys.BLUE_RIPPLE, {
        start: 5,
        end: 35,
        prefix: 'tile0',
        zeroPad: 2,
        suffix: '.png',
      }),
      duration: 1000,
      hideOnComplete: true,
    });

    this.anims.create({
      key: AnimationKeys.GREEN_RIPPLE_ANIM,
      frames: this.anims.generateFrameNames(TextureKeys.GREEN_RIPPLE, {
        start: 0,
        end: 10,
        prefix: 'tile0',
        zeroPad: 2,
        suffix: '.png',
      }),
      repeat: -1,
      duration: 600,
      hideOnComplete: true,
    });

    this.anims.create({
      key: AnimationKeys.GREEN_BUBBLES_ANIM,
      frames: this.anims.generateFrameNames(TextureKeys.GREEN_BUBBLES, {
        start: 0,
        end: 24,
        prefix: 'tile0',
        zeroPad: 2,
        suffix: '.png',
      }),
      duration: 300,
      hideOnComplete: true,
    });

    this.anims.create({
      key: AnimationKeys.GREEN_BLAST_ANIM,
      frames: this.anims.generateFrameNames(TextureKeys.GREEN_BLAST, {
        start: 13,
        end: 26,
        prefix: 'tile0',
        zeroPad: 2,
        suffix: '.png',
      }),
      delay: 200,
      duration: 100,
      hideOnComplete: true,
    });
  }

  override update(time: number, delta: number): void {
    if (this.collisions) {
      if (this.leftHand && this.group && this.group.getLength() >= 1) {
        if (!this.physics.overlap(this.leftHand, this.group, this.collisionCallback)) {
          this.isBlueHeld = false;
          this.blueHoldState.next(false);
        }
      }
      if (this.rightHand && this.group && this.group.getLength() >= 1) {
        if (!this.physics.overlap(this.rightHand, this.group, this.collisionCallback)) {
          this.isRedHeld = false;
          this.redHoldState.next(false);
        }
      }
    }
  }

  initPath(start: Circle, end: Circle, path: Circle[], settings: MovingTonesCircleSettings) {
    // texture color depends on the hand
    const textureColor = start.hand === 'right' ? 'red' : 'blue';
    const { collisionDebounce } = settings;

    this.showCirlce(start, 'start', {
      circle: start,
      collisionDebounce,
      end,
      path,
    });
  }

  showCirlce(
    circle: Circle,
    type: 'start' | 'end',
    data?: MovingTonesCircleData,
    startFromBeginning = true,
  ) {
    const { x, y, hand } = circle;
    const textureColor = hand === 'right' ? 'red' : 'blue';
    const textureKey = textureColor === 'red' ? TextureKeys.RED_CIRCLE : TextureKeys.BLUE_CIRCLE;
    const color = textureColor === 'red' ? 0xeb0000 : 0x2f51ae;
    const gameObject = this.physics.add.staticSprite(x, y, textureKey).setScale(this.circleScale);

    if (!gameObject || !this.group) return;

    // entry music for shapes
    if (type === 'start') {
      this.playHoldCircleMusic('entry');
      this.setNextNote();
    } else {
      this.playMusicCirlceEntryMusic();
    }

    const gameObjectData: {
      type: 'start' | 'end';
      color: number;
      startFromBeginning: boolean;
      circle: Circle;
      data?: { [key: string]: any };
    } = {
      type,
      color,
      startFromBeginning,
      circle,
    };

    if (data) {
      gameObjectData['data'] = data;
    }

    gameObject.setData(gameObjectData);

    gameObject && gameObject.refreshBody();
    this.circleEvents.next({ name: 'visible', circle });
    this.group.add(gameObject);
    return gameObject;
  }

  showHoldCircle(
    x: number,
    y: number,
    textureColor: 'red' | 'blue',
    type: 'start' | 'end',
    startFromBeginning = true,
  ) {
    const textureKey = textureColor === 'red' ? TextureKeys.RED_CIRCLE : TextureKeys.BLUE_CIRCLE;
    const color = textureColor === 'red' ? 0xeb0000 : 0x2f51ae;
    const gameObject = this.physics.add.staticSprite(x, y, textureKey).setScale(this.circleScale);
    if (!gameObject || !this.group) return;

    if (type === 'start') {
      this.playHoldCircleMusic('entry');
      this.setNextNote();
    } else {
      this.playMusicCirlceEntryMusic();
    }
    gameObject.setData({
      type,
      color,
      startFromBeginning,
    });
    gameObject && gameObject.refreshBody();
    this.group.add(gameObject);
    return gameObject;
  }

  showGreenCircle(circle: Circle) {
    const { x, y, hand } = circle;
    const interactableWith = hand === 'right' ? 'red' : 'blue';

    this.circleEvents.next({ name: 'visible', circle });

    const gameObject = this.physics.add
      .staticSprite(x, y, TextureKeys.MUSIC_CIRCLE)
      .setScale(this.circleScale);

    if (!gameObject || !this.group) return;

    // entry music and anim
    this.playMusicCirlceEntryMusic();
    const anim = this.add
      .sprite(x, y, TextureKeys.GREEN_RIPPLE)
      .play(AnimationKeys.GREEN_RIPPLE_ANIM)
      .setScale((0.4 * this.circleScale) / 0.6)
      .setDepth(-1)
      .setAlpha(0.5);

    gameObject.setData({
      rippleAnim: anim,
      interactableWith,
      circle,
    });

    gameObject.refreshBody();
    this.circleEvents.next({ name: 'visible', circle });
    this.group.add(gameObject);
    return gameObject;
  }

  showMusicCircle(x: number, y: number, interactableWith: 'red' | 'blue') {
    const gameObject = this.physics.add
      .staticSprite(x, y, TextureKeys.MUSIC_CIRCLE)
      .setScale(this.circleScale);

    if (!gameObject || !this.group) return;

    this.playMusicCirlceEntryMusic();
    const anim = this.add
      .sprite(x, y, TextureKeys.GREEN_RIPPLE)
      .play(AnimationKeys.GREEN_RIPPLE_ANIM)
      .setScale((0.4 * this.circleScale) / 0.6)
      .setDepth(-1)
      .setAlpha(0.5);
    gameObject.setData({
      rippleAnim: anim,
      interactableWith,
    });
    gameObject.refreshBody();
    this.group.add(gameObject);
    return gameObject;
  }

  destroy(gameObject: Phaser.GameObjects.GameObject) {
    if (gameObject && this.group) {
      this.group.remove(gameObject, true, true);
    }
  }

  destroyAllGameObjects() {
    if (this.group) {
      this.group.clear(true, true);
    }
  }

  destroyGameObjects(
    object?: 'music_circle' | 'allExceptStartCircle',
    textureKey?: TextureKeys.RED_CIRCLE | TextureKeys.BLUE_CIRCLE,
  ) {
    console.log('Destroy Game Objects::', object || 'ALL');
    if (!object) {
      // to clear the green circle animations
      (this.group.getChildren() as GameObjectWithBodyAndTexture[]).forEach((child) => {
        if (child.texture && child.texture.key === TextureKeys.MUSIC_CIRCLE) {
          const rippleAnim: Phaser.GameObjects.Sprite = child.getData('rippleAnim');
          const circle: Circle = child.getData('circle');
          this.circleEvents.next({ name: 'hidden', circle });
          rippleAnim && rippleAnim.destroy(true);
        }
      });

      // then remove all the remaining objects
      this.group.clear(true, true);
    } else {
      if (object === TextureKeys.MUSIC_CIRCLE) {
        const idxList: number[] = [];
        (this.group.getChildren() as GameObjectWithBodyAndTexture[]).forEach((child, idx) => {
          if (child.texture && child.texture.key === TextureKeys.MUSIC_CIRCLE) {
            idxList.push(idx);
          }
        });
        idxList.sort((a, b) => b - a);
        idxList.forEach((idx) => {
          const child = this.group.getChildren()[idx] as GameObjectWithBodyAndTexture;
          const rippleAnim: Phaser.GameObjects.Sprite = child.getData('rippleAnim');
          const circle: Circle = child.getData('circle');
          rippleAnim && rippleAnim.destroy(true);
          child && child.destroy(true);
          this.circleEvents.next({ name: 'hidden', circle });
        });
      } else {
        if (!textureKey) return;
        const color = textureKey === TextureKeys.BLUE_CIRCLE ? 'blue' : 'red';
        const idxList: number[] = [];
        (this.group.getChildren() as GameObjectWithBodyAndTexture[]).forEach((child, idx) => {
          if (!child || !child.texture || !child.texture.key) {
            idxList.push(idx);
          } else if (child.texture.key === TextureKeys.MUSIC_CIRCLE) {
            const childInteractableWith: 'red' | 'blue' = child.getData('interactableWith');
            if (color === childInteractableWith) {
              idxList.push(idx);
            }
          } else if (child.texture.key === textureKey) {
            const type: 'start' | 'end' = child.getData('type');
            if (type === 'end') {
              idxList.push(idx);
            }
          }
        });
        idxList.sort((a, b) => b - a);
        idxList.forEach((idx) => {
          const child = this.group.getChildren()[idx] as GameObjectWithBodyAndTexture;
          const rippleAnim: Phaser.GameObjects.Sprite = child.getData('rippleAnim');
          const circle: Circle = child.getData('circle');
          rippleAnim && rippleAnim.destroy(true);
          child && child.destroy(true);
          this.circleEvents.next({ name: 'hidden', circle });
        });
      }
    }
  }

  checkIfStartCircleExists(group: Phaser.Physics.Arcade.StaticGroup, textureKey: string) {
    for (const child of group.getChildren() as GameObjectWithBodyAndTexture[]) {
      if (child && child.texture && child.texture.key === textureKey) {
        const type: 'start' | 'end' = child.getData('type');
        if (type === 'start') {
          return true;
        }
      }
    }
    return false;
  }

  checkIfAnyHoldCirclesExist(group: Phaser.Physics.Arcade.StaticGroup) {
    for (const child of group.getChildren() as GameObjectWithBodyAndTexture[]) {
      if (
        child &&
        child.texture &&
        (child.texture.key === TextureKeys.BLUE_CIRCLE ||
          child.texture.key === TextureKeys.RED_CIRCLE)
      ) {
        return true;
      }
    }
    return false;
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
        if (
          (this.group && this.group.getLength() === 0) ||
          !this.checkIfAnyHoldCirclesExist(this.group)
        ) {
          this.destroyGameObjects(TextureKeys.MUSIC_CIRCLE);
          resolve();
          clearInterval(interval);
        }
      }, 300);
    });
  }

  private animateHeld(
    x: number,
    y: number,
    radius: number,
    color: number,
    startAngle = 0,
    duration = 2500,
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

  private animate(x: number, y: number, animationKey: 'red' | 'blue' | 'green') {
    if (animationKey === 'red') {
      this.add
        .sprite(x, y, TextureKeys.RED_RIPPLE)
        .setScale(this.circleScale)
        .play(AnimationKeys.RED_RIPPLE_ANIM);
    } else if (animationKey === 'blue') {
      this.add
        .sprite(x, y, TextureKeys.BLUE_RIPPLE)
        .setScale(this.circleScale)
        .play(AnimationKeys.BLUE_RIPPLE_ANIM);
    } else {
      this.add
        .sprite(x, y, TextureKeys.GREEN_BUBBLES)
        .setScale(this.circleScale)
        .play(AnimationKeys.GREEN_BUBBLES_ANIM);
      this.add
        .sprite(x, y, TextureKeys.GREEN_BLAST)
        .setScale(this.circleScale)
        .play(AnimationKeys.GREEN_BLAST_ANIM);
    }
  }

  private checkIfAssetsAreLoaded() {
    return this.designAssetsLoaded && this.musicFilesLoaded === this.totalMusicFiles;
  }

  async loadAssets() {
    await this.ttsService.preLoadTts('moving_tones');
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

  private subscribe() {
    this.poseSubscription = this.poseModelAdapter.getPose().subscribe((results) => {
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

  private unsubscribe() {
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
  private drawHands(results: Results): void {
    const { width, height } = this.game.canvas;
    if (!results || !Array.isArray(results.poseLandmarks)) {
      return;
    }
    if (results.poseLandmarks[15] && results.poseLandmarks[19] && this.enableLeft) {
      const leftWrist = results.poseLandmarks[15];
      const leftIndex = results.poseLandmarks[19];
      const [x, y] = this.midPoint(leftWrist.x, leftWrist.y, leftIndex.x, leftIndex.y);

      this.leftHand = this.physics.add
        .staticImage(width - x * width, y * height, TextureKeys.LEFT_HAND)
        .setDepth(-2);
    }
    if (results.poseLandmarks[16] && results.poseLandmarks[20] && this.enableRight) {
      const rightWrist = results.poseLandmarks[16];
      const rightIndex = results.poseLandmarks[20];
      const [x, y] = this.midPoint(rightWrist.x, rightWrist.y, rightIndex.x, rightIndex.y);

      // this.rightHand = this.add.arc(width - x * width, y * height, 25, 0, 360, false, 0xffffff, 0.5);
      this.rightHand = this.physics.add
        .staticImage(width - x * width, y * height, TextureKeys.RIGHT_HAND)
        .setDepth(-2);
    }
  }

  /**
   * @returns midpoint of (x1, y1) and (x2, y2).
   */
  private midPoint(x1: number, y1: number, x2: number, y2: number) {
    return [(x1 + x2) / 2, (y1 + y2) / 2];
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

  private playSuccessMusic(type: 'alto' | 'bass' | 'soprano' | 'tenor'): void {
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

  private playFailureMusic(): void {
    if (this.failureMusic && this.failureMusic.playing(this.failureMusicId)) {
      this.failureMusic.stop();
    }
    if (this.failureMusic && !this.failureMusic.playing(this.failureMusicId)) {
      this.failureMusicId = this.failureMusic.play();
    }
  }

  private playHoldCircleMusic(type: 'entry' | 'exit') {
    if (type === 'exit') {
      this.holdSuccessMusic && this.holdSuccessMusic.play();
    } else {
      this.holdEntrySound && this.holdEntrySound.play();
    }
  }

  private playMusicCirlceEntryMusic() {
    this.greenEntrySound && this.greenEntrySound.play();
  }

  /**
   * @param value default `true`.
   */
  enableMusic(value = true) {
    this.music = value;

    // unload music on disable.
    if (!value) {
      this.alto && this.alto.unload();
      this.bass && this.bass.unload();
      this.soprano && this.soprano.unload();
      this.tenor && this.tenor.unload();
      this.failureMusic && this.failureMusic.unload();
      this.holdSuccessMusic && this.holdSuccessMusic.unload();
      this.holdEntrySound && this.holdEntrySound.unload();
      this.greenEntrySound && this.greenEntrySound.unload();
      this.holdSound && this.holdSound.unload();
    }
  }

  center() {
    const { width, height } = this.game.canvas;
    return { x: width / 2, y: height / 2 };
  }

  getCenterFromPose(): Promise<Coordinate> {
    return new Promise((resolve) => {
      this.poseModelAdapter
        .getPose()
        .pipe(take(1))
        .subscribe((results) => {
          const left = {
            x: this.game.canvas.width * results.poseLandmarks[11].x,
            y: this.game.canvas.height * results.poseLandmarks[11].y,
          };
          const right = {
            x: this.game.canvas.width * results.poseLandmarks[12].x,
            y: this.game.canvas.height * results.poseLandmarks[12].y,
          };

          const midPoint = {
            x: (left.x + right.x) / 2,
            y: (left.y + right.y) / 2,
          };

          resolve(midPoint);
        });
    });
  }
}
