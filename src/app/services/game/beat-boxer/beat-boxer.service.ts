import { Injectable } from '@angular/core';
import { ElementsService } from '../../elements/elements.service';
import { HandTrackerService } from '../../classifiers/hand-tracker/hand-tracker.service';
import { TtsService } from '../../tts/tts.service';
import { CheckinService } from '../../checkin/checkin.service';
import { Store } from '@ngrx/store';
import { GameState, Genre, AnalyticsDTO, PreferenceState } from 'src/app/types/pointmotion';
import { game } from 'src/app/store/actions/game.actions';
import { SoundsService } from '../../sounds/sounds.service';
import { CalibrationService } from '../../calibration/calibration.service';
import {
  CenterOfMotion,
  BagType,
  BeatBoxerScene,
} from 'src/app/scenes/beat-boxer/beat-boxer.scene';
import { environment } from 'src/environments/environment';
import { v4 as uuidv4 } from 'uuid';

@Injectable({
  providedIn: 'root',
})
export class BeatBoxerService {
  private isServiceSetup = false;
  private genre: Genre = 'jazz';
  private globalReCalibrationCount: number;
  private bagPositions: CenterOfMotion[] = ['left', 'right'];
  private positiveLevel = [1.35, 1.4]; // right-wrist <---> right side of the screen

  // TODO: this is temporary fix, until we have levels for each of the objects.
  private negativeLevel = [0.5]; // left side of the screen  <---> left-wrist
  private bagTypes: BagType[] = ['heavy-red', 'speed-red', 'heavy-blue', 'speed-blue'];
  private analytics: AnalyticsDTO[] = [];
  private isGameComplete = false;
  private getRandomItemFromArray = <T>(array: T[]): T => {
    return array[Math.floor(Math.random() * array.length)];
  };
  private bagsAvailable: {
    left?: undefined | BagType | 'obstacle';
    right?: undefined | BagType | 'obstacle';
  } = {};

  private config = {
    gameDuration: environment.settings['beat_boxer'].configuration.gameDuration,
    speed: environment.settings['beat_boxer'].configuration.speed,
  };
  private successfulReps = 0;
  private failedReps = 0;
  private totalReps = 0;

  constructor(
    private store: Store<{
      game: GameState;
      preference: PreferenceState;
    }>,
    private elements: ElementsService,
    private handTrackerService: HandTrackerService,
    private ttsService: TtsService,
    private checkinService: CheckinService,
    private soundsService: SoundsService,
    private calibrationService: CalibrationService,
    private beatBoxerScene: BeatBoxerScene,
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

  async setup() {
    this.beatBoxerScene.enable();
    return new Promise<void>(async (resolve, reject) => {
      this.beatBoxerScene.scene.start('beatBoxer');

      console.log('Waiting for assets to Load');
      console.time('Waiting for assets to Load');
      try {
        await this.beatBoxerScene.waitForAssetsToLoad();
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
        this.ttsService.tts("Raise one of your hands when you're ready to begin.");
        this.elements.guide.state = {
          data: {
            title: "Raise one of your hands when you're ready to start.",
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
      },
      async (reCalibrationCount: number) => {
        this.ttsService.tts('Some instructions before we start');
        this.elements.ribbon.state = {
          attributes: {
            visibility: 'visible',
            reCalibrationCount,
          },
          data: {
            titles: ['INSTRUCTIONS'],
          },
        };
        await this.elements.sleep(2500);
        this.ttsService.tts(
          'For this activity, we will not require a chair. Make sure you have enough space to freely move around as you stand up for this activity.',
        );
        this.elements.overlay.state = {
          attributes: {
            visibility: 'visible',
            reCalibrationCount,
          },
          data: {
            cards: [
              {
                icon: '/assets/images/overlay_icons/no-chair.png',
                message: 'No chair required',
              },
              {
                icon: '/assets/images/overlay_icons/space-to-move.png',
                message: 'Space to move',
              },
              {
                icon: '/assets/images/overlay_icons/stand-up.png',
                message: 'Please stand up',
              },
            ],
            transitionDuration: 2500,
          },
        };
        await this.elements.sleep(9000);
      },
    ];
  }

  tutorial() {
    return [
      async (reCalibrationCount: number) => {
        this.soundsService.playActivityInstructionSound(this.genre);
        this.ttsService.tts("First, let's begin with a guide to beat boxer");
        this.elements.ribbon.state = {
          attributes: {
            visibility: 'visible',
            reCalibrationCount,
          },
          data: {
            titles: ['A Guide to Beat Boxer'],
          },
        };
        await this.elements.sleep(4000);
        this.ttsService.tts('Welcome to beat boxer');
        this.elements.guide.state = {
          data: {
            title: 'Welcome to Beat Boxer.',
            titleDuration: 2000,
          },
          attributes: {
            visibility: 'visible',
            reCalibrationCount,
          },
        };
        await this.elements.sleep(3000);
      },
      async (reCalibrationCount: number) => {
        this.ttsService.tts('Punch when you see any object on the screen.');
        this.elements.guide.state = {
          data: {
            title: 'Punch when you see an object on screen.',
            titleDuration: 2000,
          },
          attributes: {
            visibility: 'visible',
            reCalibrationCount,
          },
        };
        await this.elements.sleep(1200);
        this.beatBoxerScene.showBag(
          'left',
          'speed-blue',
          this.getRandomItemFromArray(this.negativeLevel),
        );
        const result = await this.beatBoxerScene.waitForCollisionOrTimeout('speed-blue');
        this.soundsService.playCalibrationSound('success');
        this.ttsService.tts(
          'Did you hear that? You just created sound by punching the punching bag.',
        );
        this.elements.video.state = {
          data: {
            type: 'gif',
            title: 'Did you hear that?',
            description: 'You just created sound by punching the punching bag!',
            src: 'assets/images/beat-boxer/did-you-hear-that.png',
          },
          attributes: {
            visibility: 'visible',
            reCalibrationCount,
          },
        };
        await this.elements.sleep(5000);
        this.elements.video.attributes = {
          visibility: 'hidden',
          reCalibrationCount,
        };
        this.ttsService.tts('Remember to use your right hand to punch the red bags.');
        this.elements.guide.state = {
          data: {
            title: 'Use your right hand to punch the red bag.',
            titleDuration: 3000,
          },
          attributes: {
            visibility: 'visible',
            reCalibrationCount,
          },
        };
        await this.elements.sleep(5000);
        this.ttsService.tts('Ready?');
        let successfulReps = 0;
        const repsToComplete = 4;
        this.elements.score.state = {
          data: {
            label: '',
            value: successfulReps,
            goal: repsToComplete,
          },
          attributes: {
            visibility: 'visible',
            reCalibrationCount,
          },
        };
        await this.elements.sleep(5000);
        this.elements.guide.state = {
          data: {
            title: 'Tutorial',
            showIndefinitely: true,
          },
          attributes: {
            visibility: 'visible',
            reCalibrationCount,
          },
        };
        while (successfulReps < repsToComplete) {
          const randomPosition: CenterOfMotion = this.getRandomItemFromArray(this.bagPositions);
          const randomRedBag: BagType = this.getRandomItemFromArray(this.bagTypes.slice(0, 2));

          let randomLevel = 0;
          if (randomPosition === 'left') {
            randomLevel = this.getRandomItemFromArray(this.negativeLevel);
          }
          if (randomPosition === 'right') {
            randomLevel = this.getRandomItemFromArray(this.positiveLevel);
          }
          this.beatBoxerScene.showBag(randomPosition, randomRedBag, randomLevel);

          const rep = await this.beatBoxerScene.waitForCollisionOrTimeout(randomRedBag);
          if (rep.result === 'success') {
            this.soundsService.playCalibrationSound('success');
            successfulReps += 1;
            this.elements.score.state = {
              data: {
                label: '',
                value: successfulReps,
                goal: repsToComplete,
              },
              attributes: {
                visibility: 'visible',
                reCalibrationCount,
              },
            };
          } else {
            this.soundsService.playCalibrationSound('error');
          }
          await this.elements.sleep(2000);
        }
        await this.elements.sleep(2000);
        this.elements.score.attributes = {
          visibility: 'hidden',
          reCalibrationCount,
        };
        this.ttsService.tts('Good job.');
        this.elements.guide.state = {
          data: {
            title: 'Good job!',
            showIndefinitely: true,
          },
          attributes: {
            visibility: 'visible',
            reCalibrationCount,
          },
        };
        await this.elements.sleep(5000);
      },
      async (reCalibrationCount: number) => {
        this.ttsService.tts('Remember to use your left hand when you see a blue bag.');
        this.elements.guide.state = {
          data: {
            title: 'Use your left hand to punch the blue bag.',
            titleDuration: 3000,
          },
          attributes: {
            visibility: 'visible',
            reCalibrationCount,
          },
        };
        let successfulReps = 0;
        const repsToComplete = 4;
        this.elements.score.state = {
          data: {
            label: '',
            value: successfulReps,
            goal: repsToComplete,
          },
          attributes: {
            visibility: 'visible',
            reCalibrationCount,
          },
        };
        await this.elements.sleep(5000);
        this.elements.guide.state = {
          data: {
            title: 'Tutorial',
            showIndefinitely: true,
          },
          attributes: {
            visibility: 'visible',
            reCalibrationCount,
          },
        };
        while (successfulReps < repsToComplete) {
          const randomPosition: CenterOfMotion = this.getRandomItemFromArray(this.bagPositions);
          const randomBlueBag: BagType = this.getRandomItemFromArray(this.bagTypes.slice(2, 4));
          let randomLevel = 0;
          if (randomPosition === 'left') {
            randomLevel = this.getRandomItemFromArray(this.negativeLevel);
          }
          if (randomPosition === 'right') {
            randomLevel = this.getRandomItemFromArray(this.positiveLevel);
          }
          this.beatBoxerScene.showBag(randomPosition, randomBlueBag, randomLevel);
          const rep = await this.beatBoxerScene.waitForCollisionOrTimeout(randomBlueBag);
          if (rep.result === 'success') {
            this.soundsService.playCalibrationSound('success');
            successfulReps += 1;
            this.elements.score.state = {
              data: {
                label: '',
                value: successfulReps,
                goal: repsToComplete,
              },
              attributes: {
                visibility: 'visible',
                reCalibrationCount,
              },
            };
          } else {
            this.soundsService.playCalibrationSound('error');
          }
          await this.elements.sleep(2000);
        }
        this.elements.score.attributes = {
          visibility: 'hidden',
          reCalibrationCount,
        };
        this.ttsService.tts('Well done.');
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
        await this.elements.sleep(5000);
      },
      async (reCalibrationCount: number) => {
        this.ttsService.tts('And finally, avoid punching the caution signs.');
        this.elements.guide.state = {
          data: {
            title: 'And finally, avoid punching the caution signs.',
            titleDuration: 3000,
          },
          attributes: {
            visibility: 'visible',
            reCalibrationCount,
          },
        };
        await this.elements.sleep(5000);
        this.beatBoxerScene.showBag(
          'left',
          'speed-blue',
          this.getRandomItemFromArray(this.negativeLevel),
        );
        this.beatBoxerScene.showObstacle('right', this.getRandomItemFromArray(this.positiveLevel));

        const rep = await this.beatBoxerScene.waitForCollisionOrTimeout('speed-blue', 'obstacle');
        if (rep.result === 'failure') {
          this.beatBoxerScene.destroyGameObjects('speed-blue');
          this.soundsService.playCalibrationSound('error');
          this.ttsService.tts("I knew you couldn't resist it.");
          this.elements.guide.state = {
            data: {
              title: "I knew you couldn't resist it.",
            },
            attributes: {
              visibility: 'visible',
              reCalibrationCount,
            },
          };
          await this.elements.sleep(5000);
        } else {
          this.beatBoxerScene.destroyGameObjects('obstacle');
          this.soundsService.playCalibrationSound('success');
          this.ttsService.tts('Good job!');
          this.elements.guide.state = {
            data: {
              title: 'Good job!',
            },
            attributes: {
              visibility: 'visible',
              reCalibrationCount,
            },
          };
          await this.elements.sleep(4000);
        }
      },
      async (reCalibrationCount: number) => {
        this.ttsService.tts(
          "Let's try a few movements in a sequence. And try following a rhythm like this while playing the notes this time.",
        );
        this.elements.guide.state = {
          data: {
            title: "Let's try a few moves in a sequence now.",
            titleDuration: 2000,
          },
          attributes: {
            visibility: 'visible',
            reCalibrationCount,
          },
        };
        await this.elements.sleep(1000);
        this.elements.video.state = {
          data: {
            type: 'video',
            title: 'Be the musician!',
            description: 'Try following a rhythm when you play the notes.',
            src: 'assets/videos/beat-boxer/be-the-musician.mp4',
          },
          attributes: {
            visibility: 'visible',
            reCalibrationCount,
          },
        };
        await this.elements.sleep(8000);
        this.ttsService.tts('You have the power to create the music by moving your body.');
        this.elements.video.attributes = {
          visibility: 'hidden',
          reCalibrationCount,
        };
        await this.elements.sleep(4000);
      },
      async (reCalibrationCount: number) => {
        this.elements.ribbon.state = {
          attributes: {
            visibility: 'visible',
            reCalibrationCount,
          },
          data: {
            titles: ['3', '2', '1', 'Go!'],
            titleDuration: 1200,
            tts: true,
          },
        };
        await this.elements.sleep(8000);
        this.elements.guide.state = {
          data: {
            title: 'Tutorial',
            showIndefinitely: true,
          },
          attributes: {
            visibility: 'visible',
            reCalibrationCount,
          },
        };
      },
      async (reCalibrationCount: number) => {
        let successfulReps = 0;
        const repsToComplete = 6;
        while (successfulReps < repsToComplete) {
          if (reCalibrationCount !== this.globalReCalibrationCount) {
            throw new Error('reCalibrationCount changed');
          }
          const shouldShowObstacle = Math.random() > 0.5;

          if (shouldShowObstacle) {
            if (!this.bagsAvailable.left && this.bagsAvailable.right !== 'obstacle') {
              this.beatBoxerScene.showObstacle(
                'left',
                this.getRandomItemFromArray(this.negativeLevel),
              );
              this.bagsAvailable.left = 'obstacle';
            }
            if (!this.bagsAvailable.right && this.bagsAvailable.left !== 'obstacle') {
              this.beatBoxerScene.showObstacle(
                'right',
                this.getRandomItemFromArray(this.positiveLevel),
              );
              this.bagsAvailable.right = 'obstacle';
            }
          }
          let bag: BagType;
          if (!this.bagsAvailable.left) {
            bag = this.getRandomItemFromArray(
              this.bagTypes.filter((bag) => bag !== this.bagsAvailable.right || ''),
            );
            this.beatBoxerScene.showBag(
              'left',
              bag,
              this.getRandomItemFromArray(this.negativeLevel),
            );
            this.bagsAvailable.left = bag;
          }

          if (!this.bagsAvailable.right) {
            bag = this.getRandomItemFromArray(
              this.bagTypes.filter((bag) => bag !== this.bagsAvailable.left || ''),
            );
            this.beatBoxerScene.showBag(
              'right',
              bag,
              this.getRandomItemFromArray(this.positiveLevel),
            );
            this.bagsAvailable.right = bag;
          }
          const bagTimeout = setTimeout(() => {
            this.beatBoxerScene.destroyGameObjects(bag);
            if (this.bagsAvailable.left === bag) this.bagsAvailable.left = undefined;
            if (this.bagsAvailable.right === bag) this.bagsAvailable.right = undefined;
          }, this.config.speed);

          let obstacleTimeout;
          if (this.bagsAvailable.left === 'obstacle') {
            obstacleTimeout = setTimeout(() => {
              if (this.bagsAvailable.left === 'obstacle') {
                this.beatBoxerScene.destroyGameObjects('obstacle');
                this.bagsAvailable.left = undefined;
              }
            }, this.config.speed);
          }

          if (this.bagsAvailable.right === 'obstacle') {
            obstacleTimeout = setTimeout(() => {
              if (this.bagsAvailable.right === 'obstacle') {
                this.beatBoxerScene.destroyGameObjects('obstacle');
                this.bagsAvailable.right = undefined;
              }
            }, this.config.speed);
          }

          const rep = await this.beatBoxerScene.waitForCollisionOrTimeout(
            this.bagsAvailable.left,
            this.bagsAvailable.right,
            this.config.speed,
          );

          if (rep.result === 'success') {
            successfulReps++;
            if (rep.bagType === this.bagsAvailable.left) {
              this.bagsAvailable.left = undefined;
            }
            if (rep.bagType === this.bagsAvailable.right) {
              this.bagsAvailable.right = undefined;
            }
            clearTimeout(bagTimeout);
            this.soundsService.playCalibrationSound('success');
          } else if (rep.result === 'failure') {
            clearTimeout(obstacleTimeout);
            if (rep.bagType === this.bagsAvailable.left) {
              this.bagsAvailable.left = undefined;
            }
            if (rep.bagType === this.bagsAvailable.right) {
              this.bagsAvailable.right = undefined;
            }
            this.soundsService.playCalibrationSound('error');
          } else {
            this.beatBoxerScene.destroyGameObjects();
            this.bagsAvailable.left = undefined;
            this.bagsAvailable.right = undefined;
          }
          await this.elements.sleep(this.config.speed);
        }
        await this.elements.sleep(1000);
        this.elements.confetti.state = {
          data: {},
          attributes: {
            visibility: 'visible',
            reCalibrationCount,
          },
        };
        await this.elements.sleep(3000);
        this.elements.confetti.state = {
          data: {},
          attributes: {
            visibility: 'hidden',
            reCalibrationCount,
          },
        };
        this.ttsService.tts("Great job! looks like you're getting the hang of it.");
        this.elements.guide.state = {
          data: {
            title: "Great job! looks like you're getting the hang of it.",
            titleDuration: 3500,
          },
          attributes: {
            visibility: 'visible',
            reCalibrationCount,
          },
        };
        await this.elements.sleep(3000);
      },
      async (reCalibrationCount: number) => {
        this.ttsService.tts('Guide complete.');
        this.elements.ribbon.state = {
          attributes: {
            visibility: 'visible',
            reCalibrationCount,
          },
          data: {
            titles: ['Guide Completed'],
            titleDuration: 2000,
          },
        };
        await this.elements.sleep(3000);
        await this.checkinService.updateOnboardingStatus({
          beat_boxer: true,
        });
        this.soundsService.pauseActivityInstructionSound(this.genre);
      },
    ];
  }

  preLoop() {
    return [
      async (reCalibrationCount: number) => {
        this.ttsService.tts('Starting Beat Boxer');
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
              <h1 class="pt-6 display-4">Beat Boxer</h1>
              <h1 class="pt-8" style="font-weight: 200">Area of Focus</h2>
              <h1 class="py-2">Endurance and Coordination</h2>
            </div>
            `,
            buttons: [
              {
                title: 'Starting Beat Boxer',
                progressDurationMs: 5000,
              },
            ],
          },
        };
        await this.elements.sleep(7000);
        this.ttsService.tts("Raise one of your hands when you're ready to begin.");
        this.elements.guide.state = {
          data: {
            title: "Raise one of your hands when you're ready to start.",
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
        await this.elements.sleep(2000);
        this.elements.ribbon.state = {
          attributes: {
            visibility: 'visible',
            reCalibrationCount,
          },
          data: {
            titles: ['Get Ready to Start!'],
            titleDuration: 2000,
            tts: true,
          },
        };
        await this.elements.sleep(3000);
      },
    ];
  }

  loop() {
    return [
      async (reCalibrationCount: number) => {
        this.elements.score.state = {
          data: {
            label: 'Punches',
            value: '0',
          },
          attributes: {
            visibility: 'visible',
            reCalibrationCount,
          },
        };
        const updateElapsedTime = (elapsedTime: number) => {
          if (elapsedTime >= this.config.gameDuration!) this.isGameComplete = true;
          this.store.dispatch(game.setTotalElapsedTime({ totalDuration: elapsedTime }));
        };
        this.elements.timer.state = {
          data: {
            mode: 'start',
            isCountdown: true,
            duration: this.config.gameDuration! * 1000,
            onPause: updateElapsedTime,
            onComplete: updateElapsedTime,
          },
          attributes: {
            visibility: 'visible',
            reCalibrationCount,
          },
        };
        await this.elements.sleep(5000);
      },
      async (reCalibrationCount: number) => {
        this.beatBoxerScene.enableMusic();
        // while (this.successfulReps < this.config.minCorrectReps) {
        while (!this.isGameComplete) {
          if (reCalibrationCount !== this.globalReCalibrationCount) {
            throw new Error('reCalibrationCount changed');
          }

          const shouldShowObstacle = Math.random() > 0.5;

          if (shouldShowObstacle) {
            if (!this.bagsAvailable.left && this.bagsAvailable.right !== 'obstacle') {
              this.beatBoxerScene.showObstacle(
                'left',
                this.getRandomItemFromArray(this.negativeLevel),
              );
              this.bagsAvailable.left = 'obstacle';
            }
            if (!this.bagsAvailable.right && this.bagsAvailable.left !== 'obstacle') {
              this.beatBoxerScene.showObstacle(
                'right',
                this.getRandomItemFromArray(this.positiveLevel),
              );
              this.bagsAvailable.right = 'obstacle';
            }
          }
          let bag: BagType;
          if (!this.bagsAvailable.left) {
            bag = this.getRandomItemFromArray(
              this.bagTypes.filter((bag) => bag !== this.bagsAvailable.right || ''),
            );
            this.beatBoxerScene.showBag(
              'left',
              bag,
              this.getRandomItemFromArray(this.negativeLevel),
            );
            this.bagsAvailable.left = bag;
          }

          if (!this.bagsAvailable.right) {
            bag = this.getRandomItemFromArray(
              this.bagTypes.filter((bag) => bag !== this.bagsAvailable.left || ''),
            );
            this.beatBoxerScene.showBag(
              'right',
              bag,
              this.getRandomItemFromArray(this.positiveLevel),
            );
            this.bagsAvailable.right = bag;
          }
          const leftBagTimeout = setTimeout(() => {
            this.beatBoxerScene.destroyGameObjects(this.bagsAvailable.left);
            this.bagsAvailable.left = undefined;
          }, this.config.speed);
          const rightBagTimeout = setTimeout(() => {
            this.beatBoxerScene.destroyGameObjects(this.bagsAvailable.right);
            this.bagsAvailable.right = undefined;
          }, this.config.speed);

          let obstacleTimeout;
          if (this.bagsAvailable.left === 'obstacle') {
            obstacleTimeout = setTimeout(() => {
              if (this.bagsAvailable.left === 'obstacle') {
                this.beatBoxerScene.destroyGameObjects('obstacle');
                this.bagsAvailable.left = undefined;
              }
            }, this.config.speed);
          }

          if (this.bagsAvailable.right === 'obstacle') {
            obstacleTimeout = setTimeout(() => {
              if (this.bagsAvailable.right === 'obstacle') {
                this.beatBoxerScene.destroyGameObjects('obstacle');
                this.bagsAvailable.right = undefined;
              }
            }, this.config.speed);
          }
          const promptTimestamp = Date.now();

          const rep = await this.beatBoxerScene.waitForCollisionOrTimeout(
            this.bagsAvailable.left,
            this.bagsAvailable.right,
            this.config.speed,
          );

          const resultTimestamp = Date.now();
          this.totalReps++;
          // Todo: replace placeholder values with actual values
          const hasUserInteracted: boolean = rep.result !== undefined;
          const analyticsObj = {
            prompt: {
              id: uuidv4(),
              type: 'bag',
              timestamp: promptTimestamp,
              data: {
                leftBag: this.bagsAvailable.left,
                rightBag: this.bagsAvailable.right,
              },
            },
            reaction: {
              type: 'punch',
              timestamp: Date.now(),
              startTime: Date.now(),
              completionTimeInMs: hasUserInteracted
                ? Math.abs(resultTimestamp - promptTimestamp)
                : null, // milliseconds between reaction and result if user interacted with the bag
            },
            result: {
              type: rep.result || 'failure',
              timestamp: resultTimestamp,
              score: rep.result === 'success' ? 1 : 0,
            },
          };
          this.store.dispatch(game.pushAnalytics({ analytics: [analyticsObj] }));
          if (rep.result === 'success') {
            if (rep.bagType === this.bagsAvailable.left) {
              this.bagsAvailable.left = undefined;
            }
            if (rep.bagType === this.bagsAvailable.right) {
              this.bagsAvailable.right = undefined;
            }
            clearTimeout(leftBagTimeout);
            clearTimeout(rightBagTimeout);
            this.successfulReps++;
            this.store.dispatch(game.repCompleted({ repsCompleted: this.successfulReps }));
            this.elements.score.state = {
              data: {
                label: 'Punches',
                value: this.successfulReps,
              },
              attributes: {
                visibility: 'visible',
                reCalibrationCount,
              },
            };
            this.failedReps = 0;
          } else if (rep.result === 'failure') {
            clearTimeout(obstacleTimeout);
            if (rep.bagType === this.bagsAvailable.left) {
              this.bagsAvailable.left = undefined;
            }
            if (rep.bagType === this.bagsAvailable.right) {
              this.bagsAvailable.right = undefined;
            }
            this.failedReps++;
            if (this.failedReps >= 3) {
              this.elements.timer.state = {
                data: {
                  mode: 'pause',
                },
                attributes: {
                  visibility: 'visible',
                  reCalibrationCount,
                },
              };
              await this.elements.sleep(2000);
              this.elements.video.state = {
                data: {
                  type: 'gif',
                  title: 'Right hand for red',
                  description: 'Use your right hand to punch the red punching bags.',
                  src: 'assets/images/beat-boxer/red-bag.png',
                },
                attributes: {
                  visibility: 'visible',
                  reCalibrationCount,
                },
              };
              this.ttsService.tts(
                'Remember to use your right hand when you see a red punching bag on the screen.',
              );
              await this.elements.sleep(8000);
              this.elements.video.state = {
                data: {},
                attributes: {
                  visibility: 'hidden',
                  reCalibrationCount,
                },
              };

              await this.elements.sleep(3000);
              this.elements.video.state = {
                data: {
                  type: 'gif',
                  title: 'Left hand for blue',
                  description: 'Use your left hand to punch the blue punching bags.',
                  src: 'assets/images/beat-boxer/blue-bag.png',
                },
                attributes: {
                  visibility: 'visible',
                  reCalibrationCount,
                },
              };
              this.ttsService.tts(
                'And when you see a blue punching bag on the screen, use your left hand.',
              );
              await this.elements.sleep(8000);
              this.elements.video.state = {
                data: {},
                attributes: {
                  visibility: 'hidden',
                  reCalibrationCount,
                },
              };

              await this.elements.sleep(3000);
              this.elements.timer.state = {
                data: {
                  mode: 'resume',
                },
                attributes: {
                  visibility: 'visible',
                  reCalibrationCount,
                },
              };
              this.failedReps = 0;
            }
          } else {
            if (this.bagsAvailable.left) {
              this.beatBoxerScene.destroyGameObjects(this.bagsAvailable.left);
              this.bagsAvailable.left = undefined;
            }
            if (this.bagsAvailable.right) {
              this.beatBoxerScene.destroyGameObjects(this.bagsAvailable.right);
              this.bagsAvailable.right = undefined;
            }
          }
          await this.elements.sleep(this.config.speed);
        }
        this.elements.confetti.state = {
          data: {},
          attributes: {
            visibility: 'visible',
            reCalibrationCount,
          },
        };
      },
    ];
  }

  postLoop() {
    return [
      // Todo: replace hardcoded values
      async (reCalibrationCount: number) => {
        this.beatBoxerScene.enableMusic(false);
        this.beatBoxerScene.disable();
        this.beatBoxerScene.scene.stop('beatBoxer');
        const achievementRatio = this.successfulReps / this.totalReps;
        if (achievementRatio < 0.6) {
          await this.checkinService.updateOnboardingStatus({
            beat_boxer: false,
          });
        }
        this.elements.score.attributes = {
          visibility: 'hidden',
          reCalibrationCount,
        };
        this.elements.timer.state = {
          data: {
            mode: 'stop',
          },
          attributes: {
            visibility: 'hidden',
            reCalibrationCount,
          },
        };
        const totalDuration: {
          minutes: string;
          seconds: string;
        } = this.checkinService.getDurationForTimer(this.config.gameDuration!);
        const highScore = await this.checkinService.getHighScore('beat_boxer');

        this.elements.banner.state = {
          attributes: {
            visibility: 'visible',
            reCalibrationCount,
          },
          data: {
            type: 'outro',
            htmlStr: `
          <div class="pl-10 text-start px-14" style="padding-left: 20px;">
            <h1 class="pt-8 display-3">Beat Boxer</h1>
            <h2 class="pt-7">Punches: ${this.successfulReps}</h2>
            <h2 class="pt-5">High Score: ${Math.max(
              highScore.length ? highScore[0].repsCompleted : 0,
              this.successfulReps,
            )} Punches</h2>
            <h2 class="pt-5">Time Completed: ${totalDuration.minutes}:${
              totalDuration.seconds
            } minutes</h2>
          <div>
          `,
            buttons: [
              {
                title: 'Next Activity',
                progressDurationMs: 8000,
              },
            ],
          },
        };
        await this.elements.sleep(11000);
        this.elements.banner.attributes = {
          visibility: 'hidden',
          reCalibrationCount,
        };
        await this.elements.sleep(500);
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
              <h1 class="pt-6 display-4">Sound Explorer</h1>
              <h1 class="pt-8" style="font-weight: 200">Area of Focus</h2>
              <h1 class="py-2">Range of Motion and Balance</h2>
            </div>
            `,
            buttons: [
              {
                title: 'Starting Sound Explorer',
                progressDurationMs: 5000,
              },
            ],
          },
        };
        await this.elements.sleep(6000);
      },
    ];
  }
}
