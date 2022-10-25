import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import {
  ActivityBase,
  AnalyticsDTO,
  GameState,
  Genre,
  Coordinate,
  PreferenceState,
  MovingTonesCurve,
  MovingTonesConfiguration,
} from 'src/app/types/pointmotion';
import { HandTrackerService } from '../../classifiers/hand-tracker/hand-tracker.service';
import { ElementsService } from '../../elements/elements.service';
import { GameStateService } from '../../game-state/game-state.service';
import { SoundsService } from '../../sounds/sounds.service';
import { environment } from 'src/environments/environment';
import { game } from 'src/app/store/actions/game.actions';
import { TtsService } from '../../tts/tts.service';
import { ApiService } from '../../checkin/api.service';
import { CalibrationService } from '../../calibration/calibration.service';
import { v4 as uuidv4 } from 'uuid';
import { MovingTonesScene } from 'src/app/scenes/moving-tones/moving-tones.scene';
import { GoogleAnalyticsService } from '../../google-analytics/google-analytics.service';
import { Subscription } from 'rxjs';
import { PoseService } from '../../pose/pose.service';

@Injectable({
  providedIn: 'root',
})
export class MovingTonesService implements ActivityBase {
  private isServiceSetup = false;
  private genre: Genre = 'jazz';
  private coinsCollected = 0;
  private failedReps = 0;
  private globalReCalibrationCount: number;
  private isGameComplete = false;
  private currentLevel = environment.settings['moving_tones'].currentLevel;
  private config = {
    gameDuration:
      environment.settings['moving_tones'].levels[this.currentLevel].configuration.gameDuration,
    speed: environment.settings['moving_tones'].levels[this.currentLevel].configuration.speed,
  };
  private gameDuration = this.config.gameDuration || 0;
  private totalDuration = this.config.gameDuration || 0;

  private center: Coordinate;
  private updateElapsedTime = (elapsedTime: number) => {
    if (elapsedTime >= this.gameDuration!) this.isGameComplete = true;
    this.store.dispatch(game.setTotalElapsedTime({ totalDuration: elapsedTime }));
  };

  constructor(
    private store: Store<{
      game: GameState;
      preference: PreferenceState;
    }>,
    private elements: ElementsService,
    private gameStateService: GameStateService,
    private handTrackerService: HandTrackerService,
    private soundsService: SoundsService,
    private ttsService: TtsService,
    private calibrationService: CalibrationService,
    private apiService: ApiService,
    private movingTonesScene: MovingTonesScene,
    private googleAnalyticsService: GoogleAnalyticsService,
    private poseService: PoseService,
  ) {
    this.store
      .select((state) => state.preference)
      .subscribe((preference) => {
        if (preference.genre && this.genre !== preference.genre) {
          this.genre = preference.genre;
          this.soundsService.loadMusicFiles(this.genre);
        } else {
          this.genre === 'jazz' && this.soundsService.loadMusicFiles('jazz');
        }
      });
    this.calibrationService.reCalibrationCount.subscribe((count) => {
      this.globalReCalibrationCount = count;
    });
  }

  private async waitForCollisionOrRecalibration(reCalibrationCount?: number) {
    return new Promise((resolve, reject) => {
      setInterval(() => {
        if (reCalibrationCount !== this.globalReCalibrationCount) resolve('recalibrated');
      }, 100);

      this.movingTonesScene.waitForCollisionOrTimeout().then((result) => resolve(result), reject);
    });
  }

  private getCoordinates(
    start: Coordinate,
    end: Coordinate,
    curveType: MovingTonesCurve,
    pointsInBetween: number,
  ): Coordinate[] {
    const coordinates: Coordinate[] = [];
    pointsInBetween = pointsInBetween + 1;

    const xDiff = end.x - start.x;
    const yDiff = end.y - start.y;

    if (curveType === 'line') {
      coordinates.push(start);

      for (let i = 1; i <= pointsInBetween; i++) {
        coordinates.push({
          x: start.x + (xDiff * i) / pointsInBetween,
          y: start.y + (yDiff * i) / pointsInBetween,
        });
      }
    } else if (curveType === 'semicircle') {
      const isPointOnLeft = start.x <= this.center.x && end.x <= this.center.x;

      if (isPointOnLeft) {
        start.x = 2 * this.center.x - start.x;
        end.x = 2 * this.center.x - end.x;
      }

      const angle =
        this.getAngleBetweenPoints(start.x, start.y, end.x, end.y) * (isPointOnLeft ? 1 : -1);
      const radius = Math.sqrt(
        Math.pow(this.center.x - start.x, 2) + Math.pow(this.center.y - start.y, 2),
      );

      const angleFromCenter =
        this.getAngleBetweenPoints(start.x, start.y, this.center.x, 0) * (isPointOnLeft ? 1 : -1) +
        (90 * Math.PI) / 180;

      for (let i = 0; i <= pointsInBetween; i++) {
        coordinates.push({
          x: this.center.x + radius * Math.cos((angle * i) / pointsInBetween - angleFromCenter),
          y: this.center.y + radius * Math.sin((angle * i) / pointsInBetween - angleFromCenter),
        });
      }
    } else if (curveType === 'zigzag') {
      coordinates.push(start);

      coordinates.push({ x: end.x, y: start.y });
      coordinates.push({ x: (start.x + end.x) / 2, y: (start.y + end.y) / 2 });
      coordinates.push({ x: start.x, y: end.y });

      coordinates.push(end);
    } else if (curveType === 'triangle') {
      coordinates.push(start);

      const distanceBetweenPoints = Math.sqrt(
        Math.pow(start.x - end.x, 2) + Math.pow(start.y - end.y, 2),
      );

      const isPointOnLeft = end.x < start.x;
      const isPointOnBottom = end.y > start.y;

      coordinates.push(
        this.getThirdPointInTriangle(
          start,
          end,
          (distanceBetweenPoints * 2) / 3,
          isPointOnLeft,
          isPointOnBottom,
        ),
      );

      coordinates.push(end);
    }

    return coordinates;
  }

  private async getRelativeCoordinates(
    start: Coordinate,
    end: Coordinate,
  ): Promise<[start: Coordinate, end: Coordinate]> {
    const ratio = await this.poseService.getHeightRatio();

    const newEnd: Coordinate = {
      x: (1 - ratio) * start.x + ratio * end.x,
      y: (1 - ratio) * start.y + ratio * end.y,
    };

    return [start, newEnd];
  }

  private async showCircles({
    left,
    right,
  }: {
    left?: Coordinate[];
    right?: Coordinate[];
  }): Promise<{
    blueSubscription: Subscription | undefined;
    redSubscription: Subscription | undefined;
  }> {
    if (left?.length) {
      this.movingTonesScene.showHoldCircle(left[0].x, left[0].y, 'blue', 'start');
    }
    if (right?.length) {
      this.movingTonesScene.showHoldCircle(right[0].x, right[0].y, 'red', 'start');
    }

    let blueSubscription: Subscription | undefined;
    let redSubscription: Subscription | undefined;

    if (left?.length) {
      blueSubscription = this.movingTonesScene.blueHoldState.subscribe(async (state) => {
        if (state) {
          for (let i = 1; i < left.length; i++) {
            if (i === left.length - 1) {
              this.movingTonesScene.showHoldCircle(left[i].x, left[i].y, 'blue', 'end');
            } else {
              this.movingTonesScene.showMusicCircle(left[i].x, left[i].y, 'blue');
            }
            await this.elements.sleep(150);
          }
        }
      });
    }
    if (right?.length) {
      redSubscription = this.movingTonesScene.redHoldState.subscribe(async (state) => {
        if (state) {
          for (let i = 1; i < right.length; i++) {
            if (i === right.length - 1) {
              this.movingTonesScene.showHoldCircle(right[i].x, right[i].y, 'red', 'end');
            } else {
              this.movingTonesScene.showMusicCircle(right[i].x, right[i].y, 'red');
            }
            await this.elements.sleep(150);
          }
        }
      });
    }

    return { blueSubscription, redSubscription };
  }

  private async getRandomConfiguration(): Promise<MovingTonesConfiguration> {
    this.center = await this.movingTonesScene.getCenterFromPose();
    console.log('center: ', this.center);
    const configurations: MovingTonesConfiguration[] = [
      {
        startLeft: {
          x: this.center.x - 50,
          y: this.center.y - 130,
        },
        endLeft: {
          x: 50,
          y: this.center.y + 200,
        },
        startRight: {
          x: this.center.x + 50,
          y: this.center.y - 130,
        },
        endRight: {
          x: 2 * this.center.x - 50,
          y: this.center.y + 200,
        },
        curveType: 'semicircle',
        pointsInBetween: 2,
      }, // quadrants - top to side
      {
        startLeft: {
          x: this.center.x - 50,
          y: this.center.y + 220,
        },
        endLeft: {
          x: 50,
          y: this.center.y - 200,
        },
        startRight: {
          x: this.center.x + 50,
          y: this.center.y + 220,
        },
        endRight: {
          x: 2 * this.center.x - 50,
          y: this.center.y - 200,
        },
        curveType: 'semicircle',
        pointsInBetween: 2,
      }, // bottom to side
      {
        startLeft: {
          x: this.center.x - 50,
          y: this.center.y + 170,
        },
        endLeft: {
          x: this.center.x - 300,
          y: this.center.y,
        },
        startRight: {
          x: this.center.x + 50,
          y: this.center.y - 170,
        },
        endRight: {
          x: this.center.x + 300,
          y: this.center.y,
        },
        curveType: 'semicircle',
        pointsInBetween: 1,
      }, // opposite hand
      {
        startLeft: {
          x: this.center.x - 50,
          y: this.center.y - 170,
        },
        endLeft: {
          x: this.center.x - 300,
          y: this.center.y,
        },
        startRight: {
          x: this.center.x + 50,
          y: this.center.y + 170,
        },
        endRight: {
          x: this.center.x + 300,
          y: this.center.y,
        },
        curveType: 'semicircle',
        pointsInBetween: 1,
      }, // opposite hand
      {
        startLeft: {
          x: this.center.x - 50,
          y: this.center.y - 150,
        },
        endLeft: {
          x: this.center.x - 50,
          y: this.center.y + 200,
        },
        startRight: {
          x: this.center.x + 50,
          y: this.center.y - 150,
        },
        endRight: {
          x: this.center.x + 50,
          y: this.center.y + 200,
        },
        curveType: 'semicircle',
        pointsInBetween: 2,
      }, // semicircles - top to bottom
      {
        startLeft: {
          x: this.center.x / 2 + 50,
          y: this.center.y,
        },
        endLeft: {
          x: this.center.x / 2 + 100,
          y: this.center.y - 150,
        },
        startRight: {
          x: this.center.x + this.center.x / 2 - 50,
          y: this.center.y,
        },
        endRight: {
          x: this.center.x + this.center.x / 2 - 100,
          y: this.center.y - 150,
        },
        curveType: 'triangle',
        pointsInBetween: 1,
      }, // triangles - top
      {
        startLeft: {
          x: this.center.x / 2 + 50,
          y: this.center.y,
        },
        endLeft: {
          x: this.center.x / 2 + 100,
          y: this.center.y + 150,
        },
        startRight: {
          x: this.center.x + this.center.x / 2 - 50,
          y: this.center.y,
        },
        endRight: {
          x: this.center.x + this.center.x / 2 - 100,
          y: this.center.y + 150,
        },
        curveType: 'triangle',
        pointsInBetween: 1,
      }, // bottom
      {
        startRight: {
          x: this.center.x,
          y: this.center.y - 100,
        },
        endRight: {
          x: this.center.x + 150,
          y: this.center.y + 150,
        },
        curveType: 'zigzag',
        pointsInBetween: 3,
      }, // zigzag - middle to right
      {
        startRight: {
          x: this.center.x + 150,
          y: this.center.y - 100,
        },
        endRight: {
          x: this.center.x,
          y: this.center.y + 150,
        },
        curveType: 'zigzag',
        pointsInBetween: 3,
      }, // zigzag - right to middle
      {
        startLeft: {
          x: this.center.x,
          y: this.center.y - 100,
        },
        endLeft: {
          x: this.center.x - 150,
          y: this.center.y + 150,
        },
        curveType: 'zigzag',
        pointsInBetween: 3,
      }, // middle to left
      {
        startLeft: {
          x: this.center.x - 150,
          y: this.center.y - 100,
        },
        endLeft: {
          x: this.center.x,
          y: this.center.y + 150,
        },
        curveType: 'zigzag',
        pointsInBetween: 3,
      }, // left to middle
      {
        startLeft: {
          x: this.center.x - 100,
          y: this.center.y - 100,
        },
        endLeft: {
          x: this.center.x - 100,
          y: this.center.y + 350,
        },
        startRight: {
          x: this.center.x + 100,
          y: this.center.y - 100,
        },
        endRight: {
          x: this.center.x + 100,
          y: this.center.y + 350,
        },
        curveType: 'line',
        pointsInBetween: 2,
      }, // line
    ];

    const randomConfiguration = configurations[Math.floor(Math.random() * configurations.length)];
    return randomConfiguration;
  }

  private async game(reCalibrationCount?: number) {
    while (!this.isGameComplete) {
      if (reCalibrationCount !== this.globalReCalibrationCount) {
        this.movingTonesScene.destroyGameObjects();
        throw new Error('reCalibrationCount changed');
      }

      const { startLeft, endLeft, startRight, endRight, curveType, pointsInBetween } =
        await this.getRandomConfiguration();

      let leftCoordinates: Coordinate[] = [];
      let rightCoordinates: Coordinate[] = [];

      if (startLeft && endLeft) {
        const relativeCoordinates = await this.getRelativeCoordinates(startLeft, endLeft);
        leftCoordinates = this.getCoordinates(...relativeCoordinates, curveType, pointsInBetween);
      }
      if (startRight && endRight) {
        const relativeCoordinates = await this.getRelativeCoordinates(startRight, endRight);
        rightCoordinates = this.getCoordinates(...relativeCoordinates, curveType, pointsInBetween);
      }

      const isSemicircle =
        endLeft && endLeft.x === this.center.x - 100 && endLeft.y === this.center.y + 150;

      if (isSemicircle) {
        const shouldReverseOneSide = Math.random() > 0.5;

        if (shouldReverseOneSide) {
          leftCoordinates = leftCoordinates.reverse();
        }
      }

      const shouldReverse = Math.random() > 0.5;

      if (shouldReverse) {
        leftCoordinates.reverse();
        rightCoordinates.reverse();
      }

      const subscriptions = await this.showCircles({
        left: leftCoordinates,
        right: rightCoordinates,
      });
      const promptTimestamp = Date.now();

      const result = await this.waitForCollisionOrRecalibration(reCalibrationCount);

      subscriptions.blueSubscription?.unsubscribe();
      subscriptions.redSubscription?.unsubscribe();

      if (result === 'recalibrated') {
        this.movingTonesScene.destroyGameObjects();
        throw new Error('reCalibrationCount changed');
      }

      const resultTimestamp = Date.now();
      this.store.dispatch(game.setScore({ score: this.coinsCollected }));

      const resultStatus: 'success' | 'failure' = 'success';

      // Todo: store in analytics
      const analyticsObj = {
        prompt: {
          id: uuidv4(),
          type: 'circles',
          timestamp: promptTimestamp,
          data: {
            leftCoordinates,
            rightCoordinates,
          },
        },
        reaction: {
          type: 'interact',
          timestamp: Date.now(),
          startTime: Date.now(),
          completionTimeInMs: Math.abs(resultTimestamp - promptTimestamp),
        },
        result: {
          type: resultStatus,
          timestamp: resultTimestamp,
          score: 1,
        },
      };
      this.store.dispatch(game.pushAnalytics({ analytics: [analyticsObj] }));
      await this.elements.sleep(200);
    }
  }

  private getAngleBetweenPoints(x1: number, y1: number, x2: number, y2: number): number {
    const angle1 = Math.atan2(y1 - this.center.y, x1 - this.center.x);
    const angle2 = Math.atan2(y2 - this.center.y, x2 - this.center.x);
    return angle1 - angle2;
  }

  private getThirdPointInTriangle(
    A: Coordinate,
    B: Coordinate,
    dist: number,
    left = true,
    bottom = false,
  ) {
    const nx = B.x - A.x;
    const ny = B.y - A.y;
    dist /= Math.sqrt(nx * nx + ny * ny) * (left ? -1 : 1) * (bottom ? -1 : 1);
    return {
      x: A.x + nx / 2 - ny * dist,
      y: A.y + ny / 2 + nx * dist,
    };
  }

  private replayOrTimeout(timeout = 10000) {
    return new Promise(async (resolve, reject) => {
      this.handTrackerService.waitUntilHandRaised('both-hands').then(() => resolve(true), reject);
      setTimeout(() => resolve(false), timeout);
    });
  }

  async setup() {
    this.movingTonesScene.enable();
    this.center = this.movingTonesScene.center();
    return new Promise<void>(async (resolve, reject) => {
      this.movingTonesScene.scene.start('movingTones');

      console.log('Waiting for assets to Load');
      console.time('Waiting for assets to Load');
      try {
        await this.movingTonesScene.waitForAssetsToLoad();
        console.log('Design Assets and Music files are Loaded!!');
      } catch (err) {
        console.error(err);
        // this.soundExplorerScene.scene.restart();
        reject();
      }
      console.timeEnd('Waiting for assets to Load');
      this.isServiceSetup = true;
      resolve();
    });
  }

  welcome() {
    return [
      async (reCalibrationCount: number) => {
        if (!this.isServiceSetup) {
          this.elements.banner.state = {
            attributes: {
              visibility: 'visible',
              reCalibrationCount,
            },
            data: {
              type: 'loader',
              htmlStr: `
          <div class="w-full h-full d-flex flex-column justify-content-center align-items-center px-10">
            <h1 class="pt-4 display-3">Loading Game...</h1>
            <h3 class="pt-8 pb-4">Please wait while we download the audio and video files for the game. It should take less than a minute.</h3>
          </div>
          `,
              buttons: [
                {
                  title: '',
                  infiniteProgress: true,
                },
              ],
            },
          };
          await this.setup();

          this.elements.banner.state = {
            data: {},
            attributes: {
              reCalibrationCount,
              visibility: 'hidden',
            },
          };
        }
      },
      async (reCalibrationCount: number) => {
        this.soundsService.playActivityInstructionSound(this.genre);
        this.ttsService.tts('Last activity. Moving Tones.');
        this.elements.banner.state = {
          attributes: {
            visibility: 'visible',
            reCalibrationCount,
          },
          data: {
            type: 'intro',
            htmlStr: `
            <div class="w-full h-full d-flex flex-column justify-content-center align-items-center">
              <h1 class="pt-2">Last Activity</h2>
              <h1 class="pt-6 display-4">Moving Tones</h1>
              <h1 class="pt-8" style="font-weight: 200">Area of Focus</h2>
              <h1 class="py-2">Range of Motion</h2>
            </div>
            `,
            buttons: [
              {
                title: 'Starting Moving Tones',
                progressDurationMs: 5000,
              },
            ],
          },
        };
        await this.elements.sleep(7000);
      },
      async (reCalibrationCount: number) => {
        this.elements.overlay.state = {
          attributes: {
            visibility: 'visible',
            reCalibrationCount,
          },
          data: {
            cards: [
              {
                icon: '/assets/images/overlay_icons/hand.png',
                message: 'Fingers stretched wide',
              },
              {
                icon: '/assets/images/overlay_icons/dorsal.png',
                message: 'Posture upright and big',
              },
              {
                icon: '/assets/images/overlay_icons/width.png',
                message: 'Move feet to reach objects',
              },
            ],
            transitionDuration: 3500,
          },
        };
        await this.elements.sleep(2000);
        this.ttsService.tts(
          'Make sure to have your fingers stretched while playing this game. Keep an upright posture and stay big. Move your feet if required to reach the objects on the screen.',
        );
        await this.elements.sleep(15000);
      },
    ];
  }

  tutorial() {
    return [
      async (reCalibrationCount: number) => {
        this.ttsService.tts('Raise one of your hands to start the tutorial.');
        this.elements.guide.state = {
          data: {
            title: 'Raise one of your hands to start the tutorial.',
            showIndefinitely: true,
          },
          attributes: {
            visibility: 'visible',
            reCalibrationCount,
          },
        };
        await this.handTrackerService.waitUntilHandRaised('any-hand');
        this.soundsService.playCalibrationSound('success');
        this.elements.guide.attributes = {
          visibility: 'hidden',
          reCalibrationCount,
        };
        this.soundsService.pauseActivityInstructionSound(this.genre);
        await this.elements.sleep(2000);
      },
      async (reCalibrationCount: number) => {
        this.ttsService.tts(
          'The objective of this game is to collect as many green coins as you can.',
        );
        this.elements.guide.state = {
          data: {
            title: 'The objective of this game is to collect the green coins.',
            titleDuration: 5000,
          },
          attributes: {
            visibility: 'visible',
            reCalibrationCount,
          },
        };
        await this.elements.sleep(6000);
        this.elements.video.state = {
          data: {
            type: 'gif',
            title: 'Collect the Coins!',
            description: `Follow your hand over the green coins to collect as many as you can within ${
              (this.config.gameDuration || 3) / 60
            } minutes.`,
            src: 'assets/videos/moving-tones/first-collect.gif',
          },
          attributes: {
            visibility: 'visible',
            reCalibrationCount,
          },
        };
        this.ttsService.tts(
          `Move your hands over the green coins to collect as many as you can in ${
            (this.config.gameDuration || 3) / 60
          } minutes.`,
        );
        await this.elements.sleep(6000);
        this.elements.video.state = {
          data: {},
          attributes: {
            visibility: 'hidden',
            reCalibrationCount,
          },
        };
        await this.elements.sleep(1000);
      },
      async (reCalibrationCount: number) => {
        this.elements.video.state = {
          data: {
            type: 'gif',
            title: 'Red for Right Hand',
            description:
              'Hold the right hand over the red circle when it first appears on the screen to load the music coins.',
            src: 'assets/videos/moving-tones/red-right.gif',
          },
          attributes: {
            visibility: 'visible',
            reCalibrationCount,
          },
        };
        this.ttsService.tts(
          'Hold the right hand over the red circle when it first appears, to load the music coins.',
        );
        await this.elements.sleep(6000);
        this.elements.video.state = {
          data: {},
          attributes: {
            visibility: 'hidden',
            reCalibrationCount,
          },
        };

        this.movingTonesScene.showHoldCircle(this.center.x + 100, 100, 'red', 'start');
        await this.movingTonesScene.waitForCollisionOrTimeout();
        this.soundsService.playCalibrationSound('success');
      },
      async (reCalibrationCount: number) => {
        this.ttsService.tts("Now let's try the other hand.");
        this.elements.guide.state = {
          data: {
            title: "Now let's try the other hand.",
            titleDuration: 3000,
          },
          attributes: {
            visibility: 'visible',
            reCalibrationCount,
          },
        };
        await this.elements.sleep(4000);
        this.elements.video.state = {
          data: {
            type: 'gif',
            title: 'Blue for Left Hand',
            description:
              'Hold the left hand over the blue circle when it first appears on the screen to load the music coins.',
            src: 'assets/videos/moving-tones/blue-left.gif',
          },
          attributes: {
            visibility: 'visible',
            reCalibrationCount,
          },
        };
        this.ttsService.tts(
          'Hold the left hand over the blue circle when it first appears, to load the music coins.',
        );
        await this.elements.sleep(6000);
        this.elements.video.state = {
          data: {},
          attributes: {
            visibility: 'hidden',
            reCalibrationCount,
          },
        };

        this.movingTonesScene.showHoldCircle(this.center.x - 100, 100, 'blue', 'start');
        await this.movingTonesScene.waitForCollisionOrTimeout();
        this.soundsService.playCalibrationSound('success');
      },
      async (reCalibrationCount: number) => {
        this.ttsService.tts("Let's try with both hands now.");
        this.elements.guide.state = {
          data: {
            title: "Let's try with both hands now.",
            titleDuration: 3000,
          },
          attributes: {
            visibility: 'visible',
            reCalibrationCount,
          },
        };
        await this.elements.sleep(4000);

        this.movingTonesScene.showHoldCircle(this.center.x - 100, 100, 'blue', 'start');
        this.movingTonesScene.showHoldCircle(this.center.x + 100, 100, 'red', 'start');

        await this.movingTonesScene.waitForCollisionOrTimeout();
        this.soundsService.playCalibrationSound('success');
      },
      async (reCalibrationCount: number) => {
        this.elements.video.state = {
          data: {
            type: 'gif',
            title: 'Collect the Coins!',
            description:
              'Follow your hand over the music coins to collect them and finish on the same colour you started with.',
            src: 'assets/videos/moving-tones/second-collect.gif',
          },
          attributes: {
            visibility: 'visible',
            reCalibrationCount,
          },
        };
        this.ttsService.tts(
          'Follow your hand over the music coins to collect them and finish on the same colour on which you started.',
        );
        await this.elements.sleep(6000);
        this.elements.video.state = {
          data: {},
          attributes: {
            visibility: 'hidden',
            reCalibrationCount,
          },
        };

        const startLeft = {
          x: this.center.x - 100,
          y: this.center.y - 270,
        };
        const endLeft = {
          x: 50,
          y: this.center.y + 100,
        };
        const startRight = {
          x: this.center.x + 100,
          y: this.center.y - 270,
        };
        const endRight = {
          x: 2 * this.center.x - 50,
          y: this.center.y + 100,
        };
        const leftCoordinates = this.getCoordinates(startLeft, endLeft, 'semicircle', 2);
        const rightCoordinates = this.getCoordinates(startRight, endRight, 'semicircle', 2);

        const subscriptions = await this.showCircles({
          left: leftCoordinates,
          right: rightCoordinates,
        });

        await this.movingTonesScene.waitForCollisionOrTimeout();

        subscriptions.blueSubscription?.unsubscribe();
        subscriptions.redSubscription?.unsubscribe();

        this.ttsService.tts('Well done!');

        this.elements.guide.state = {
          data: {
            title: 'Well done!',
            titleDuration: 2500,
          },
          attributes: {
            visibility: 'visible',
            reCalibrationCount,
          },
        };

        await this.apiService.updateOnboardingStatus({
          moving_tones: true,
        });
        await this.elements.sleep(3000);
      },
      async (reCalibrationCount: number) => {
        this.ttsService.tts("You're ready to start collecting some music coins.");
        this.elements.guide.state = {
          data: {
            title: "You're ready to start collecting some music coins.",
            titleDuration: 3500,
          },
          attributes: {
            visibility: 'visible',
            reCalibrationCount,
          },
        };
        await this.elements.sleep(4000);
        this.ttsService.tts('Tutorial Completed.');
        this.elements.guide.state = {
          data: {
            title: 'Tutorial Completed.',
            titleDuration: 2500,
          },
          attributes: {
            visibility: 'visible',
            reCalibrationCount,
          },
        };
        await this.elements.sleep(3000);
      },
    ];
  }

  preLoop() {
    return [];
  }

  loop() {
    return [
      async (reCalibrationCount: number) => {
        this.ttsService.tts("Let's begin.");
        this.elements.guide.state = {
          data: {
            title: "Let's begin.",
            titleDuration: 2500,
          },
          attributes: {
            visibility: 'visible',
            reCalibrationCount,
          },
        };
        await this.elements.sleep(3000);

        this.movingTonesScene.score.next(0);

        this.movingTonesScene.score.subscribe((score) => {
          if (score == 1) this.coinsCollected++;
          else if (score == -1) this.failedReps++;

          this.elements.score.state = {
            attributes: {
              visibility: 'visible',
              reCalibrationCount,
            },
            data: {
              icon: '/assets/images/moving_tones/coin.png',
              value: this.coinsCollected,
            },
          };
        });

        this.elements.ribbon.state = {
          attributes: {
            visibility: 'visible',
            reCalibrationCount,
          },
          data: {
            titles: ['3', '2', '1', "Let's Go!"],
            titleDuration: 1000,
            tts: true,
          },
        };
        await this.elements.sleep(7000);
      },
      async (reCalibrationCount: number) => {
        // game starts
        this.elements.timer.state = {
          data: {
            mode: 'start',
            isCountdown: true,
            duration: this.gameDuration! * 1000,
            onPause: this.updateElapsedTime,
            onComplete: this.updateElapsedTime,
          },
          attributes: {
            visibility: 'visible',
            reCalibrationCount,
          },
        };

        await this.game(reCalibrationCount);
      },
      async (reCalibrationCount: number) => {
        this.ttsService.tts(
          'Raise both your hands if you want to add 30 more seconds to this activity.',
        );
        this.elements.guide.state = {
          data: {
            title: 'Raise both your hands to add 30 seconds.',
            showIndefinitely: true,
          },
          attributes: {
            visibility: 'visible',
            reCalibrationCount,
          },
        };
        this.elements.banner.state = {
          attributes: {
            visibility: 'visible',
            reCalibrationCount,
          },
          data: {
            type: 'action',
            htmlStr: `
              <div class="text-center row">
                <h1 class="pt-4 display-3">Times Up!</h1>
                <h2 class="pb-8 display-6">Want to improve your score?</h2>
                <button class="btn btn-primary d-flex align-items-center progress col mx-16"><span class="m-auto d-inline-block">Add 30 more seconds</span></button>
              <div>
            `,
            buttons: [
              {
                title: 'Continue',
                progressDurationMs: 9000,
              },
            ],
          },
        };
        const shouldReplay = await this.replayOrTimeout(10000);
        this.elements.banner.attributes = {
          visibility: 'hidden',
          reCalibrationCount,
        };
        this.elements.guide.attributes = {
          visibility: 'hidden',
          reCalibrationCount,
        };
        if (shouldReplay) {
          this.soundsService.playCalibrationSound('success');

          this.isGameComplete = false;

          this.elements.timer.state = {
            data: {
              mode: 'start',
              isCountdown: true,
              duration: 30_000,
              onPause: this.updateElapsedTime,
              onComplete: this.updateElapsedTime,
            },
            attributes: {
              visibility: 'visible',
              reCalibrationCount,
            },
          };
          this.gameDuration = 30;
          this.totalDuration += 30;

          await this.game(reCalibrationCount);
        }
        this.elements.timer.attributes = {
          visibility: 'hidden',
          reCalibrationCount,
        };
        this.elements.score.attributes = {
          visibility: 'hidden',
          reCalibrationCount,
        };
      },
    ];
  }

  postLoop() {
    return [
      async (reCalibrationCount: number) => {
        this.ttsService.tts('Activity completed.');
        this.elements.guide.state = {
          data: {
            title: 'Activity completed.',
            titleDuration: 2500,
          },
          attributes: {
            visibility: 'visible',
            reCalibrationCount,
          },
        };
        await this.elements.sleep(3000);
      },
      async (reCalibrationCount: number) => {
        const totalReps = this.coinsCollected + this.failedReps;
        const achievementRatio = this.coinsCollected / totalReps;

        if (achievementRatio < 0.6) {
          await this.apiService.updateOnboardingStatus({
            moving_tones: false,
          });
        }

        const totalDuration: {
          minutes: string;
          seconds: string;
        } = this.apiService.getDurationForTimer(this.totalDuration);
        const highScore = await this.apiService.getHighScore('moving_tones');

        this.ttsService.tts(
          `Coins collected: ${this.coinsCollected}, time completed: ${this.totalDuration} minutes.`,
        );
        this.elements.banner.state = {
          attributes: {
            visibility: 'visible',
            reCalibrationCount,
          },
          data: {
            type: 'outro',
            htmlStr: `
          <div class="pl-10 text-start px-14" style="padding-left: 20px;">
            <h1 class="pt-8 display-3">Moving Tones</h1>
            <h2 class="pt-7">Coins Collected: ${this.coinsCollected}</h2>
            <h2 class="pt-5">High Score: ${highScore} Coins</h2>
            <h2 class="pt-5">Time Completed: ${totalDuration.minutes}:${totalDuration.seconds} minutes</h2>
          <div>
          `,
            buttons: [
              {
                title: 'Back to Homepage',
                progressDurationMs: 10000,
              },
            ],
          },
        };

        await this.elements.sleep(12000);
        this.elements.banner.attributes = {
          visibility: 'hidden',
          reCalibrationCount,
        };

        this.ttsService.tts('Well done. See you soon!');
        this.elements.guide.state = {
          data: {
            title: 'Well done. See you soon!',
            titleDuration: 2500,
          },
          attributes: {
            visibility: 'visible',
            reCalibrationCount,
          },
        };
        await this.elements.sleep(4000);

        this.store.dispatch(game.gameCompleted());
        this.googleAnalyticsService.sendEvent('level_end', {
          level_name: 'moving_tones',
        });
        await this.gameStateService.postLoopHook();

        window.parent.postMessage(
          {
            type: 'end-game',
          },
          '*',
        );
      },
    ];
  }
}
