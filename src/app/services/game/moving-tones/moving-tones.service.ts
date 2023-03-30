import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import {
  ActivityBase,
  ActivityConfiguration,
  AnalyticsDTO,
  Coordinate,
  GameState,
  Genre,
  MovingTonesCircle,
  MovingTonesConfiguration,
  MovingTonesCurve,
  PreferenceState,
} from 'src/app/types/pointmotion';
import { HandTrackerService } from '../../classifiers/hand-tracker/hand-tracker.service';
import { ElementsService } from '../../elements/elements.service';
import { SoundsService } from '../../sounds/sounds.service';
import { environment } from 'src/environments/environment';
import { game } from 'src/app/store/actions/game.actions';
import { TtsService } from '../../tts/tts.service';
import { ApiService } from '../../checkin/api.service';
import { CalibrationService } from '../../calibration/calibration.service';
import { v4 as uuidv4 } from 'uuid';
import { MovingTonesScene } from 'src/app/scenes/moving-tones/moving-tones.scene';
import { Subscription } from 'rxjs';
import { ActivityHelperService } from '../activity-helper/activity-helper.service';
import { PoseModelAdapter } from '../../pose-model-adapter/pose-model-adapter.service';

@Injectable({
  providedIn: 'root',
})
export class MovingTonesService implements ActivityBase {
  private isServiceSetup = false;
  private genre: Genre = 'jazz';
  private coinsCollected = 0;
  private failedReps = 0;
  private globalReCalibrationCount: number;

  private shouldReplay: boolean;

  private gameSettings = environment.settings['moving_tones'];
  qaGameSettings?: any;
  private currentLevel = environment.settings['moving_tones'].currentLevel;
  private config = {
    gameDuration:
      environment.settings['moving_tones'].levels[this.currentLevel].configuration.gameDuration,
    speed: environment.settings['moving_tones'].levels[this.currentLevel].configuration.speed,
  };
  private gameDuration = this.config.gameDuration || 0;
  private totalDuration = this.config.gameDuration || 0;

  private timedOut = false;
  private timeOutFirstTime = false;
  private lastRepPrompted = false;

  private collisionDebounce = this.config.speed || 1500;
  private progressBarSubscription: Subscription;

  private comboStreak = 0;
  private health = 3;
  private score = 0;

  private center: Coordinate;
  constructor(
    private store: Store<{
      game: GameState;
      preference: PreferenceState;
    }>,
    private elements: ElementsService,
    private handTrackerService: HandTrackerService,
    private soundsService: SoundsService,
    private ttsService: TtsService,
    private calibrationService: CalibrationService,
    private apiService: ApiService,
    private movingTonesScene: MovingTonesScene,
    private poseModelAdapter: PoseModelAdapter,
    private activityHelperService: ActivityHelperService,
  ) {
    this.resetVariables();
    this.store
      .select((state) => state.preference)
      .subscribe((preference) => {
        if (preference && preference.genre && this.genre !== preference.genre) {
          this.genre = preference.genre;
          this.gameSettings.levels[this.currentLevel].configuration.genre = this.genre;
          this.soundsService.loadMusicFiles(this.genre);
        } else {
          this.genre === 'jazz' && this.soundsService.loadMusicFiles('jazz');
        }
      });
    this.calibrationService.reCalibrationCount.subscribe((count) => {
      this.globalReCalibrationCount = count;
    });
  }

  resetVariables() {
    this.isServiceSetup = false;
    this.genre = 'jazz';
    this.coinsCollected = 0;
    this.failedReps = 0;
    this.globalReCalibrationCount = 0;
    this.shouldReplay = false;
    this.gameSettings = environment.settings['moving_tones'];
    this.qaGameSettings = undefined;
    this.currentLevel = environment.settings['moving_tones'].currentLevel;
    this.config = {
      gameDuration:
        environment.settings['moving_tones'].levels[this.currentLevel].configuration.gameDuration,
      speed: environment.settings['moving_tones'].levels[this.currentLevel].configuration.speed,
    };
    this.gameDuration = this.config.gameDuration || 0;
    this.totalDuration = this.config.gameDuration || 0;
    this.timedOut = false;
    this.timeOutFirstTime = false;
    this.lastRepPrompted = false;
    this.collisionDebounce = this.config.speed || 1500;
    if (this.progressBarSubscription) {
      this.progressBarSubscription.unsubscribe();
    }

    this.comboStreak = 0;
    this.score = 0;
    this.health = 3;
  }

  private async waitForCollisionOrRecalibration(reCalibrationCount?: number) {
    return new Promise((resolve, reject) => {
      setInterval(() => {
        if (reCalibrationCount !== this.globalReCalibrationCount) resolve('recalibrated');
      }, 100);
      // const interval = setInterval(() => {
      //   if (this.health > 0 && !this.lastRepPrompted) {
      //     clearInterval(interval);
      //     this.lastRepPrompted = true;
      //     this.ttsService.tts('Do the last movement to complete the activity');
      //     this.elements.guide.state = {
      //       data: {
      //         title: 'Do the last movement to complete the activity',
      //         titleDuration: 2000,
      //       },
      //       attributes: {
      //         visibility: 'visible',
      //         reCalibrationCount,
      //       },
      //     };
      //   }
      // }, 400);

      this.movingTonesScene.waitForCollisionOrTimeout(10000).then((result) => {
        if (this.timedOut) {
          this.timedOut = false;
          return resolve('timeout');
        }
        resolve(result);
      }, reject);
    });
  }

  private initTimeoutForPaths(path1: MovingTonesCircle[], path2?: MovingTonesCircle[]) {
    // const timeoutDuration = 10_000;
    // let pathsCompleted = 0;
    // const startTimeout = () =>
    //   setTimeout(() => {
    //     this.movingTonesScene.destroyGameObjects();
    //     this.timedOut = true;
    //     if (this.timeOutFirstTime) {
    //       this.timeOutFirstTime = false;
    //       this.ttsService.tts('Try touching the circles in 10 seconds or we move to the next set.');
    //       this.elements.guide.state = {
    //         data: {
    //           title: 'Try touching the circles in 10 seconds or we move to the next set.',
    //           titleDuration: 3000,
    //         },
    //         attributes: {
    //           visibility: 'visible',
    //         },
    //       };
    //     }
    //   }, timeoutDuration);
    // let timeout = startTimeout();
    // const startCircle1 = path1.filter((circle) => circle.type === 'start')[0];
    // const endCircle1 = path1.filter((circle) => circle.type === 'end')[0];
    // const startCircle2 = path2?.filter((circle) => circle.type === 'start')[0];
    // const endCircle2 = path2?.filter((circle) => circle.type === 'end')[0];
    // const circleEventSubscription = this.movingTonesScene.circleEvents.subscribe((event) => {
    //   const hasCoinsLoaded =
    //     (startCircle1.id === event.circle.id || startCircle2?.id === event.circle.id) &&
    //     event.name === 'collisionCompleted';
    //   const hasMotionCompleted =
    //     (endCircle1.id === event.circle.id || endCircle2?.id === event.circle.id) &&
    //     event.name === 'collisionCompleted';
    //   const hasAllPathsCompleted = path2 ? pathsCompleted === 2 : pathsCompleted === 1;
    //   if (hasCoinsLoaded) {
    //     clearTimeout(timeout);
    //     timeout = startTimeout();
    //   } else if (hasMotionCompleted) {
    //     pathsCompleted++;
    //     clearTimeout(timeout);
    //     timeout = startTimeout();
    //   }
    //   if (hasAllPathsCompleted) {
    //     circleEventSubscription.unsubscribe();
    //     clearTimeout(timeout);
    //   }
    // });
  }

  private getCirclesInPath(
    start: Coordinate,
    end: Coordinate,
    curveType: MovingTonesCurve,
    pointsInBetween: number,
    hand: 'left' | 'right',
  ): MovingTonesCircle[] {
    const coordinates: Coordinate[] = [];
    const pointsIncludingLast = pointsInBetween + 1;

    const xDiff = end.x - start.x;
    const yDiff = end.y - start.y;

    if (curveType === 'line') {
      coordinates.push(start);

      for (let i = 1; i <= pointsIncludingLast; i++) {
        coordinates.push({
          x: start.x + (xDiff * i) / pointsIncludingLast,
          y: start.y + (yDiff * i) / pointsIncludingLast,
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

      for (let i = 0; i <= pointsIncludingLast; i++) {
        coordinates.push({
          x: this.center.x + radius * Math.cos((angle * i) / pointsIncludingLast - angleFromCenter),
          y: this.center.y + radius * Math.sin((angle * i) / pointsIncludingLast - angleFromCenter),
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

    const circlesInPath: MovingTonesCircle[] = coordinates.map((coordinate, idx) => ({
      x: coordinate.x,
      y: coordinate.y,
      id: uuidv4(),
      type: idx === 0 ? 'start' : idx === coordinates.length - 1 ? 'end' : 'music_coin',
      hand,
    }));
    return circlesInPath;
  }

  private async getRelativeCoordinates(
    start: Coordinate,
    end: Coordinate,
  ): Promise<[start: Coordinate, end: Coordinate]> {
    const ratio = await this.poseModelAdapter.getHeightRatio();

    const newEnd: Coordinate = {
      x: (1 - ratio) * start.x + ratio * end.x,
      y: (1 - ratio) * start.y + ratio * end.y,
    };

    return [start, newEnd];
  }

  private async getRandomPath(): Promise<{
    leftPath: MovingTonesCircle[];
    rightPath: MovingTonesCircle[];
  }> {
    this.center = await this.movingTonesScene.getCenterFromPose();
    const configurations: MovingTonesConfiguration[] = [
      {
        startLeft: {
          x: this.center.x - 50,
          y: Math.max(this.center.y - 130, 20),
        },
        endLeft: {
          x: 50,
          y: Math.max(this.center.y - 130, 20) + 330,
        },
        startRight: {
          x: this.center.x + 50,
          y: Math.max(this.center.y - 130, 20),
        },
        endRight: {
          x: 2 * this.center.x - 50,
          y: Math.max(this.center.y - 130, 20) + 330,
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
          y: Math.min(this.center.y + 170, 2 * this.center.y - 20),
        },
        endLeft: {
          x: this.center.x - 300,
          y: this.center.y,
        },
        startRight: {
          x: this.center.x + 50,
          y: Math.max(this.center.y - 170, 20),
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
          y: Math.max(this.center.y - 170, 20),
        },
        endLeft: {
          x: this.center.x - 300,
          y: this.center.y,
        },
        startRight: {
          x: this.center.x + 50,
          y: Math.min(this.center.y + 170, 2 * this.center.y - 20),
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
          y: Math.max(this.center.y - 150, 20),
        },
        endLeft: {
          x: this.center.x - 50,
          y: this.center.y + 200,
        },
        startRight: {
          x: this.center.x + 50,
          y: Math.max(this.center.y - 150, 20),
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
          x: this.center.x / 2 - 40,
          y: Math.max(this.center.y - 150, 20) + 150,
        },
        endLeft: {
          x: this.center.x / 2 - 10,
          y: Math.max(this.center.y - 150, 20),
        },
        startRight: {
          x: this.center.x + this.center.x / 2 + 40,
          y: Math.max(this.center.y - 150, 20) + 150,
        },
        endRight: {
          x: this.center.x + this.center.x / 2 - 10,
          y: Math.max(this.center.y - 150, 20),
        },
        curveType: 'triangle',
        pointsInBetween: 1,
      }, // triangles - top
      {
        startLeft: {
          x: this.center.x / 2 - 40,
          y: this.center.y,
        },
        endLeft: {
          x: this.center.x / 2 - 10,
          y: this.center.y + 150,
        },
        startRight: {
          x: this.center.x + this.center.x / 2 + 40,
          y: this.center.y,
        },
        endRight: {
          x: this.center.x + this.center.x / 2 - 10,
          y: this.center.y + 150,
        },
        curveType: 'triangle',
        pointsInBetween: 1,
      }, // bottom
      {
        startRight: {
          x: this.center.x,
          y: Math.max(this.center.y - 100, 20),
        },
        endRight: {
          x: this.center.x + 250,
          y: this.center.y + 250,
        },
        curveType: 'zigzag',
        pointsInBetween: 3,
      }, // zigzag - middle to right
      {
        startRight: {
          x: this.center.x + 250,
          y: Math.max(this.center.y - 100, 20),
        },
        endRight: {
          x: this.center.x,
          y: this.center.y + 250,
        },
        curveType: 'zigzag',
        pointsInBetween: 3,
      }, // zigzag - right to middle
      {
        startLeft: {
          x: this.center.x,
          y: Math.max(this.center.y - 100, 20),
        },
        endLeft: {
          x: this.center.x - 250,
          y: this.center.y + 250,
        },
        curveType: 'zigzag',
        pointsInBetween: 3,
      }, // middle to left
      {
        startLeft: {
          x: this.center.x - 250,
          y: Math.max(this.center.y - 100, 20),
        },
        endLeft: {
          x: this.center.x,
          y: this.center.y + 250,
        },
        curveType: 'zigzag',
        pointsInBetween: 3,
      }, // left to middle
      {
        startLeft: {
          x: this.center.x - 100,
          y: Math.max(this.center.y - 180, 20),
        },
        endLeft: {
          x: this.center.x - 100,
          y: this.center.y + 420,
        },
        startRight: {
          x: this.center.x + 100,
          y: Math.max(this.center.y - 180, 20),
        },
        endRight: {
          x: this.center.x + 100,
          y: this.center.y + 420,
        },
        curveType: 'line',
        pointsInBetween: 2,
      }, // line
    ];

    const { startLeft, endLeft, startRight, endRight, curveType, pointsInBetween } =
      configurations[Math.floor(Math.random() * configurations.length)];

    if (this.comboStreak > 0 && this.comboStreak % 3 === 0) {
      const baseDistance = 5;
      const distanceMultiplier = this.comboStreak / 3;
      if (startLeft && endLeft) {
        startLeft.x -= baseDistance * distanceMultiplier;
        endLeft.x -= baseDistance * distanceMultiplier;
      }

      if (startRight && endRight) {
        startRight.x += baseDistance * distanceMultiplier;
        endRight.x += baseDistance * distanceMultiplier;
      }
    }

    let leftPath: MovingTonesCircle[] = [];
    let rightPath: MovingTonesCircle[] = [];

    if (startLeft && endLeft) {
      const relativeCoordinates = await this.getRelativeCoordinates(startLeft, endLeft);
      leftPath = this.getCirclesInPath(...relativeCoordinates, curveType, pointsInBetween, 'left');
    }
    if (startRight && endRight) {
      const relativeCoordinates = await this.getRelativeCoordinates(startRight, endRight);
      rightPath = this.getCirclesInPath(
        ...relativeCoordinates,
        curveType,
        pointsInBetween,
        'right',
      );
    }

    const isSemicircle =
      endLeft && endLeft.x === this.center.x - 100 && endLeft.y === this.center.y + 150;

    if (isSemicircle) {
      const shouldReverseOneSide = Math.random() > 0.5;

      if (shouldReverseOneSide) {
        leftPath.reverse();
      }
    }

    const shouldReverse = Math.random() > 0.5;

    if (shouldReverse && curveType !== 'zigzag') {
      leftPath.reverse();
      rightPath.reverse();
    }
    return { leftPath, rightPath };
  }

  // private initProgressBars(reCalibrationCount?: number) {
  //   this.progressBarSubscription = this.movingTonesScene.circleEvents.subscribe((event) => {
  //     console.log('circle event: ', event);
  //     if (
  //       event.name === 'collisionStarted' &&
  //       !['music_coin', 'danger_coin'].includes(event.circle.type)
  //     ) {
  //       if (event.circle.hand === 'left') {
  //         const isRedProgressBarShown =
  //           this.elements.timeout.state.data.bars &&
  //           this.elements.timeout.state.data.bars.includes('red');
  //         if (isRedProgressBarShown) {
  //           this.elements.timeout.state.data.bars = ['blue', 'red'];
  //         } else {
  //           this.elements.timeout.state = {
  //             data: {
  //               mode: 'start',
  //               timeout: this.collisionDebounce,
  //               bars: ['blue'],
  //             },
  //             attributes: {
  //               visibility: 'visible',
  //               reCalibrationCount,
  //             },
  //           };
  //         }
  //       } else {
  //         const isBlueProgressBarShown =
  //           this.elements.timeout.state.data.bars &&
  //           this.elements.timeout.state.data.bars.includes('blue');
  //         if (isBlueProgressBarShown) {
  //           this.elements.timeout.state.data.bars = ['blue', 'red'];
  //         } else {
  //           this.elements.timeout.state = {
  //             data: {
  //               mode: 'start',
  //               timeout: this.collisionDebounce,
  //               bars: ['red'],
  //             },
  //             attributes: {
  //               visibility: 'visible',
  //               reCalibrationCount,
  //             },
  //           };
  //         }
  //       }
  //     } else if (
  //       (event.name === 'collisionEnded' || event.name === 'collisionCompleted') &&
  //       !['music_coin', 'danger_coin'].includes(event.circle.type)
  //     ) {
  //       this.elements.timeout.state = {
  //         data: {
  //           mode: 'stop',
  //         },
  //         attributes: {
  //           visibility: 'hidden',
  //           reCalibrationCount,
  //         },
  //       };
  //     }
  //   });
  // }

  private async game(reCalibrationCount?: number) {
    // this.initProgressBars(reCalibrationCount);

    while (this.health > 0) {
      if (reCalibrationCount !== this.globalReCalibrationCount) {
        this.movingTonesScene.destroyGameObjects();
        this.progressBarSubscription.unsubscribe();
        throw new Error('reCalibrationCount changed');
      }

      const paths = await this.getRandomPath();
      const { leftPath, rightPath } = paths;

      const startLeft = leftPath.filter((circle) => circle.type === 'start')[0];
      const endLeft = leftPath.filter((circle) => circle.type === 'end')[0];
      const leftCoins = leftPath.filter((circle) => circle.type === 'music_coin');

      const startRight = rightPath.filter((circle) => circle.type === 'start')[0];
      const endRight = rightPath.filter((circle) => circle.type === 'end')[0];
      const rightCoins = rightPath.filter((circle) => circle.type === 'music_coin');

      // setting a random coin as 'danger coin'
      if (leftCoins.length > 2) {
        const randomIndex = Math.floor(Math.random() * leftCoins.length);
        leftCoins[randomIndex].type = 'danger_coin';
      }

      if (rightCoins.length > 2) {
        const randomIndex = Math.floor(Math.random() * rightCoins.length);
        rightCoins[randomIndex].type = 'danger_coin';
      }

      console.log('right hand: ', leftPath, startRight, endRight, rightCoins);
      console.log('left hand: ', rightPath, startLeft, endLeft, leftCoins);

      if (leftPath.length > 0) {
        this.movingTonesScene.initPath(startLeft, endLeft, leftCoins, {
          collisionDebounce: this.collisionDebounce,
        });
      }
      if (rightPath.length > 0) {
        this.movingTonesScene.initPath(startRight, endRight, rightCoins, {
          collisionDebounce: this.collisionDebounce,
        });
      }
      // this.initTimeoutForPaths(leftPath, rightPath);
      const promptTimestamp = Date.now();

      this.elements.timeout.state = {
        data: {
          mode: 'start',
          timeout: 10000,
          bars: ['yellow'],
        },
        attributes: {
          visibility: 'visible',
          reCalibrationCount,
        },
      };
      const result = await this.waitForCollisionOrRecalibration(reCalibrationCount);
      this.movingTonesScene.destroyGameObjects();
      this.elements.timeout.state = {
        data: {
          mode: 'stop',
        },
        attributes: {
          visibility: 'hidden',
          reCalibrationCount,
        },
      };
      if (result === 'recalibrated') {
        this.movingTonesScene.destroyGameObjects();
        throw new Error('reCalibrationCount changed');
      }

      const resultTimestamp = Date.now();
      this.store.dispatch(game.setScore({ score: this.coinsCollected }));

      const resultStatus: 'success' | 'failure' = 'success';

      // Todo: store in analytics
      const analyticsObj: AnalyticsDTO = {
        prompt: {
          id: uuidv4(),
          type: 'circles',
          timestamp: promptTimestamp,
          data: {
            leftPath,
            rightPath,
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
          coin: 0,
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

  async setupConfig() {
    const settings = await this.apiService.getGameSettings('moving_tones');
    if (settings && settings.settings && settings.settings.currentLevel) {
      this.qaGameSettings = settings.settings.levels[this.currentLevel]?.configuration;
      if (this.qaGameSettings) {
        if (this.qaGameSettings.gameDuration) {
          this.config.gameDuration = this.qaGameSettings.gameDuration;
          this.gameDuration = this.qaGameSettings.gameDuration;
        }
        if (this.qaGameSettings.speed) {
          this.config.speed = this.qaGameSettings.speed;
        }
      }
    }
    this.movingTonesScene.enable();
    this.movingTonesScene.allowClosedHandsDuringCollision = true;
    this.movingTonesScene.allowClosedHandsWhileHoldingPose = true;

    const heightRatio = await this.poseModelAdapter.getHeightRatio();
    this.movingTonesScene.circleScale *= heightRatio;

    this.center = this.movingTonesScene.center();
    this.movingTonesScene.scene.start('movingTones');
  }

  async setup() {
    await this.setupConfig();
    return new Promise<void>(async (resolve, reject) => {
      console.log('Waiting for assets to Load');
      console.time('Waiting for assets to Load');
      try {
        await this.movingTonesScene.loadAssets(this.genre);
        this.gameSettings.levels[this.currentLevel].configuration.musicSet =
          this.movingTonesScene.currentSet;
        console.log('Design Assets and Music files are Loaded!!');
      } catch (err) {
        console.error(err);
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
        }
        this.elements.banner.state = {
          data: {},
          attributes: {
            reCalibrationCount,
            visibility: 'hidden',
          },
        };
      },
      async (reCalibrationCount: number) => {
        this.ttsService.tts('Next activity. Moving Tones.');
        this.elements.banner.state = {
          attributes: {
            visibility: 'visible',
            reCalibrationCount,
          },
          data: {
            type: 'intro',
            htmlStr: `
            <div class="w-full h-full d-flex flex-column justify-content-center align-items-center">
              <h1 class="pt-2">Next Activity</h2>
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
                icon: '/assets/images/overlay_icons/raise-hand.jpg',
                message: 'Space to raise hands',
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
          'Make sure you have enough space to raise your hands. Keep an upright posture and stay big. Move your feet if required to reach the objects on the screen.',
        );
        await this.elements.sleep(15000);
      },
    ];
  }

  tutorial() {
    return [
      async (reCalibrationCount: number) => {
        this.soundsService.playActivityInstructionSound(this.genre);

        this.elements.ribbon.state = {
          attributes: {
            visibility: 'visible',
            reCalibrationCount,
          },
          data: {
            titles: ['A Guide to Moving Tones'],
          },
        };
        await this.elements.sleep(2500);
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
        this.ttsService.tts('Let’s try it out.');
        this.elements.guide.state = {
          data: {
            title: 'Let’s try it out.',
            titleDuration: 2500,
          },
          attributes: {
            visibility: 'visible',
            reCalibrationCount,
          },
        };
        await this.elements.sleep(2500);
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
        this.elements.video.hide();
      },
      async (reCalibrationCount: number) => {
        this.ttsService.tts('Hold your right hand over the red circle.');
        this.elements.guide.state = {
          data: {
            title: 'Hold your right hand over the red circle.',
            showIndefinitely: true,
          },
          attributes: {
            visibility: 'visible',
            reCalibrationCount,
          },
        };

        const startRight = {
          x: this.center.x + 100,
          y: this.center.y - 270,
        };
        const endRight = {
          x: 2 * this.center.x - 50,
          y: this.center.y + 100,
        };
        const rightCoordinates = this.getCirclesInPath(
          startRight,
          endRight,
          'semicircle',
          2,
          'right',
        );

        const startRightCircle = rightCoordinates.filter((c) => c.type === 'start')[0];
        const endRightCircle = rightCoordinates.filter((c) => c.type === 'end')[0];
        const rightCoins = rightCoordinates.filter((c) => c.type === 'music_coin');
        const rightCoinIds = rightCoins.map((coin) => coin.id);

        let coinsCollected = 0;
        let motionCompleted = false;
        let repCompleted = false;

        while (!repCompleted) {
          const circleEventSubscription = this.movingTonesScene.circleEvents.subscribe((event) => {
            if (event.circle.id === startRightCircle.id && event.name === 'collisionCompleted') {
              this.ttsService.tts('Once loaded, you can collect the coins with your right hand.');
              this.elements.guide.state = {
                data: {
                  title: 'Once loaded, you can collect the coins with your right hand.',
                  showIndefinitely: true,
                },
                attributes: {
                  visibility: 'visible',
                  reCalibrationCount,
                },
              };
            }
            if (rightCoinIds.includes(event.circle.id) && event.name === 'collisionCompleted') {
              coinsCollected++;
            }
            const holdFinalCircle: boolean =
              event.circle.id === endRightCircle.id && event.name === 'collisionStarted';
            const allCoinsCollected: boolean = coinsCollected === rightCoins.length;

            if ((allCoinsCollected || holdFinalCircle) && !motionCompleted) {
              motionCompleted = true;
              this.ttsService.tts('Hold the pose at the end to complete the motion.');
              this.elements.guide.state = {
                data: {
                  title: 'Hold the pose at the end to complete the motion.',
                  showIndefinitely: true,
                },
                attributes: {
                  visibility: 'visible',
                  reCalibrationCount,
                },
              };
            }
          });

          this.movingTonesScene.initPath(startRightCircle, endRightCircle, rightCoins, {
            collisionDebounce: this.collisionDebounce,
          });
          this.initTimeoutForPaths(rightCoordinates);

          const result = await this.waitForCollisionOrRecalibration(reCalibrationCount);
          repCompleted = result !== 'timeout';

          if (result === 'recalibrated') {
            this.movingTonesScene.destroyGameObjects();
            circleEventSubscription.unsubscribe();
            throw new Error('reCalibrationCount changed');
          }
          if (!repCompleted) {
            this.ttsService.tts("Let's try that again.");
            this.elements.guide.state = {
              data: {
                title: "Let's try that again.",
                titleDuration: 2500,
              },
              attributes: {
                visibility: 'visible',
                reCalibrationCount,
              },
            };
            await this.elements.sleep(2500);
          }
          circleEventSubscription.unsubscribe();
        }

        this.ttsService.tts('Well done!');
        this.elements.guide.state = {
          data: {
            title: 'Well done!',
            titleDuration: 2000,
          },
          attributes: {
            visibility: 'visible',
            reCalibrationCount,
          },
        };
        await this.elements.sleep(2500);
      },
      async (reCalibrationCount: number) => {
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
        this.elements.video.hide();
      },
      async (reCalibrationCount: number) => {
        this.ttsService.tts('Hold your left hand over the blue circle.');
        this.elements.guide.state = {
          data: {
            title: 'Hold your left hand over the blue circle.',
            showIndefinitely: true,
          },
          attributes: {
            visibility: 'visible',
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
        const leftCoordinates = this.getCirclesInPath(startLeft, endLeft, 'semicircle', 2, 'left');

        const startLeftCircle = leftCoordinates.filter((c) => c.type === 'start')[0];
        const endLeftCircle = leftCoordinates.filter((c) => c.type === 'end')[0];
        const leftCoins = leftCoordinates.filter((c) => c.type === 'music_coin');
        const leftCoinIds = leftCoins.map((coin) => coin.id);

        let coinsCollected = 0;
        let motionCompleted = false;
        let repCompleted = false;

        while (!repCompleted) {
          const circleEventSubscription = this.movingTonesScene.circleEvents.subscribe((event) => {
            if (event.circle.id === startLeftCircle.id && event.name === 'collisionCompleted') {
              this.ttsService.tts('Once loaded, you can collect the coins with your left hand.');
              this.elements.guide.state = {
                data: {
                  title: 'Once loaded, you can collect the coins with your left hand.',
                  showIndefinitely: true,
                },
                attributes: {
                  visibility: 'visible',
                  reCalibrationCount,
                },
              };
            }
            if (leftCoinIds.includes(event.circle.id) && event.name === 'collisionCompleted') {
              coinsCollected++;
            }
            const allCoinsCollected: boolean = coinsCollected === leftCoins.length;
            const holdFinalCircle: boolean =
              event.circle.id === endLeftCircle.id && event.name === 'collisionStarted';
            if ((allCoinsCollected || holdFinalCircle) && !motionCompleted) {
              motionCompleted = true;
              this.ttsService.tts('Hold the pose at the end to complete the motion.');
              this.elements.guide.state = {
                data: {
                  title: 'Hold the pose at the end to complete the motion.',
                  showIndefinitely: true,
                },
                attributes: {
                  visibility: 'visible',
                  reCalibrationCount,
                },
              };
            }
          });

          this.movingTonesScene.initPath(startLeftCircle, endLeftCircle, leftCoins, {
            collisionDebounce: this.collisionDebounce,
          });

          this.initTimeoutForPaths(leftCoordinates);

          const result = await this.waitForCollisionOrRecalibration(reCalibrationCount);
          repCompleted = result !== 'timeout';

          if (result === 'recalibrated') {
            this.movingTonesScene.destroyGameObjects();
            circleEventSubscription.unsubscribe();
            throw new Error('reCalibrationCount changed');
          }
          if (!repCompleted) {
            this.ttsService.tts("Let's try that again.");
            this.elements.guide.state = {
              data: {
                title: "Let's try that again.",
                titleDuration: 2500,
              },
              attributes: {
                visibility: 'visible',
                reCalibrationCount,
              },
            };
            await this.elements.sleep(2500);
          }
          circleEventSubscription.unsubscribe();
        }

        this.ttsService.tts('Well done!');
        this.elements.guide.state = {
          data: {
            title: 'Well done!',
            titleDuration: 2000,
          },
          attributes: {
            visibility: 'visible',
            reCalibrationCount,
          },
        };
        await this.elements.sleep(2500);
      },
      async (reCalibrationCount: number) => {
        // both hands
        let repCompleted = false;

        while (!repCompleted) {
          this.ttsService.tts('Try stretching to touch both at the same time.');
          this.elements.guide.state = {
            data: {
              title: 'Try stretching to touch both at the same time.',
              titleDuration: 3000,
            },
            attributes: {
              visibility: 'visible',
              reCalibrationCount,
            },
          };
          await this.elements.sleep(4000);
          this.ttsService.tts("If you can't you can touch them one after the other as well.");
          this.elements.guide.state = {
            data: {
              title: "If you can't you can touch them one after the other as well.",
              titleDuration: 4000,
            },
            attributes: {
              visibility: 'visible',
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
          const leftCoordinates = this.getCirclesInPath(
            startLeft,
            endLeft,
            'semicircle',
            2,
            'left',
          );

          const startLeftCircle = leftCoordinates.filter((c) => c.type === 'start')[0];
          const endLeftCircle = leftCoordinates.filter((c) => c.type === 'end')[0];
          const leftCoins = leftCoordinates.filter((c) => c.type === 'music_coin');

          const startRight = {
            x: this.center.x + 100,
            y: this.center.y - 270,
          };
          const endRight = {
            x: 2 * this.center.x - 50,
            y: this.center.y + 100,
          };
          const rightCoordinates = this.getCirclesInPath(
            startRight,
            endRight,
            'semicircle',
            2,
            'right',
          );

          const startRightCircle = rightCoordinates.filter((c) => c.type === 'start')[0];
          const endRightCircle = rightCoordinates.filter((c) => c.type === 'end')[0];
          const rightCoins = rightCoordinates.filter((c) => c.type === 'music_coin');

          this.movingTonesScene.initPath(startLeftCircle, endLeftCircle, leftCoins, {
            collisionDebounce: this.collisionDebounce,
          });

          this.movingTonesScene.initPath(startRightCircle, endRightCircle, rightCoins, {
            collisionDebounce: this.collisionDebounce,
          });

          this.initTimeoutForPaths(leftCoordinates, rightCoordinates);

          const result = await this.waitForCollisionOrRecalibration(reCalibrationCount);
          repCompleted = result !== 'timeout';

          if (result === 'recalibrated') {
            this.movingTonesScene.destroyGameObjects();
            throw new Error('reCalibrationCount changed');
          }
          if (!repCompleted) {
            this.ttsService.tts("Let's try that again.");
            this.elements.guide.state = {
              data: {
                title: "Let's try that again.",
                titleDuration: 2500,
              },
              attributes: {
                visibility: 'visible',
                reCalibrationCount,
              },
            };
            await this.elements.sleep(2500);
          }
        }
        this.ttsService.tts("Good job! Looks like you're ready to start the activity.");
        this.elements.guide.state = {
          data: {
            title: "Good job! Looks like you're ready to start the activity.",
            titleDuration: 3000,
          },
          attributes: {
            visibility: 'visible',
            reCalibrationCount,
          },
        };
        await this.apiService.updateOnboardingStatus({
          moving_tones: true,
        });
        await this.elements.sleep(3500);
        this.soundsService.stopActivityInstructionSound(this.genre);
      },
    ];
  }

  preLoop() {
    return [
      async (reCalibrationCount: number) => {
        this.movingTonesScene.playBacktrack();
      },
    ];
  }

  loop() {
    return [
      async (reCalibrationCount: number) => {
        this.movingTonesScene.enableMusic();
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

        // this.movingTonesScene.score.subscribe((score) => {
        //   if (score == 1) this.coinsCollected++;
        //   else if (score == -1) this.failedReps++;

        //   this.elements.score.state = {
        //     attributes: {
        //       visibility: 'visible',
        //       reCalibrationCount,
        //     },
        //     data: {
        //       score: this.coinsCollected,
        //     },
        //   };
        // });

        this.elements.ribbon.state = {
          data: {
            titles: ['Get Ready to Start', 'On your mark', 'Get Set', 'Go!'],
            titleDuration: 1500,
            tts: true,
          },
          attributes: {
            visibility: 'visible',
            reCalibrationCount,
          },
        };
        await this.elements.sleep(9000);
      },
      async (reCalibrationCount: number) => {
        this.elements.health.state = {
          data: {
            total: 3,
            value: this.health,
          },
          attributes: {
            visibility: 'visible',
            reCalibrationCount,
          },
        };

        this.movingTonesScene.circleEvents.subscribe((event) => {
          if (
            event.name === 'collisionCompleted' &&
            ['music_coin', 'danger_coin'].includes(event.circle.type)
          ) {
            if (event.circle.type === 'danger_coin') {
              // change health and reset combo streak
              this.health -= 1;
              this.comboStreak = 0;

              this.elements.health.state = {
                data: {
                  total: 3,
                  value: this.health,
                },
                attributes: {
                  visibility: 'visible',
                  reCalibrationCount,
                },
              };
            } else {
              // increase score and combo streak
              this.comboStreak += 1;

              let multiplier = 1;
              // x2 multiplier for every 3 correct motions in a row
              if (this.comboStreak > 0 && this.comboStreak % 3 === 0) {
                multiplier = 2 * (this.comboStreak / 3);
              }

              // timeout bonus multiplier
              if (event.timeoutDuration) {
                if (event.timeoutDuration < 25) {
                  multiplier += 4;
                } else if (event.timeoutDuration < 50) {
                  multiplier += 3;
                } else if (event.timeoutDuration < 75) {
                  multiplier += 2;
                } else {
                  multiplier += 1;
                }
              }

              const score = multiplier;
              if (event.position) {
                this.movingTonesScene.animateScore(event.position.x, event.position.y, score);
              }

              this.score += score;
              this.elements.score.state = {
                data: {
                  value: this.score,
                },
                attributes: {
                  visibility: 'visible',
                  reCalibrationCount,
                },
              };
            }
          }
        });
      },
      async (reCalibrationCount: number) => {
        await this.game(reCalibrationCount);
      },
      async (reCalibrationCount: number) => {
        this.elements.score.attributes = {
          visibility: 'hidden',
          reCalibrationCount,
        };
        this.elements.health.hide();
      },
    ];
  }

  stopGame() {
    this.movingTonesScene.disable();
    this.movingTonesScene.enableMusic(false);
    this.movingTonesScene.stopBacktrack();
    this.movingTonesScene.scene.stop('movingTones');
    this.gameSettings.levels[this.currentLevel].configuration.speed = this.config.speed;
    this.apiService.updateGameSettings('moving_tones', this.gameSettings);
    this.elements.timer.state = {
      data: {
        mode: 'stop',
      },
      attributes: {
        visibility: 'hidden',
      },
    };
  }

  postLoop() {
    return [
      async (reCalibrationCount: number) => {
        this.stopGame();
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
        const totalReps = this.coinsCollected + this.failedReps;
        const achievementRatio = this.coinsCollected / totalReps;

        if (achievementRatio < 0.25) {
          await this.apiService.updateOnboardingStatus({
            moving_tones: false,
          });
        }
      },
    ];
  }
}
