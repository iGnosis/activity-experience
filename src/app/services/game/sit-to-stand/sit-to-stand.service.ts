import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import { take } from 'rxjs';
import {
  ActivityBase,
  AnalyticsDTO,
  GameLevels,
  GameState,
  Genre,
  PreferenceState,
} from 'src/app/types/pointmotion';
import { HandTrackerService } from '../../classifiers/hand-tracker/hand-tracker.service';
import { ElementsService } from '../../elements/elements.service';
import { SitToStandService as Sit2StandService } from '../../classifiers/sit-to-stand/sit-to-stand.service';
import { SoundsService } from '../../sounds/sounds.service';
import { environment } from 'src/environments/environment';
import { game } from 'src/app/store/actions/game.actions';
import { TtsService } from '../../tts/tts.service';
import { ApiService } from '../../checkin/api.service';
import { CalibrationService } from '../../calibration/calibration.service';
import { SitToStandScene } from 'src/app/scenes/sit-to-stand/sit-to-stand.scene';
import { v4 as uuidv4 } from 'uuid';

@Injectable({
  providedIn: 'root',
})
export class SitToStandService implements ActivityBase {
  private isServiceSetup = false;
  private genre: Genre = 'jazz';
  private globalReCalibrationCount: number;

  qaGameSettings?: any;
  // init default config values.
  private gameSettings = environment.settings['sit_stand_achieve'];
  private currentLevel = environment.settings['sit_stand_achieve'].currentLevel;
  private streak = 0;
  private levelUpStreak = 10;
  private shouldLevelUp = false;
  private config = {
    minCorrectReps: this.gameSettings.levels[this.currentLevel].configuration.minCorrectReps,
    speed: this.gameSettings.levels[this.currentLevel].configuration.speed,
  };

  private successfulReps = 0;
  private failedReps = 0;
  private totalReps = 0;

  private targetReps = this.config.minCorrectReps;
  private totalDuration = 0;

  private shouldReplay = false;

  private gameStartTime: number | null;
  private firstPromptTime: number | null;
  private loopStartTime: number | null;

  private analytics: AnalyticsDTO[] = [];

  constructor(
    private store: Store<{
      game: GameState;
      preference: PreferenceState;
    }>,
    private elements: ElementsService,
    private handTrackerService: HandTrackerService,
    private sit2StandService: Sit2StandService,
    private sit2StandScene: SitToStandScene,
    private soundsService: SoundsService,
    private ttsService: TtsService,
    private calibrationService: CalibrationService,
    private apiService: ApiService,
  ) {
    this.store
      .select((state) => state.preference)
      .subscribe((preference) => {
        if (preference && preference.genre && this.genre !== preference.genre) {
          this.genre = preference.genre;
          this.gameSettings.levels[this.currentLevel].configuration.genre = this.genre;
          this.soundsService.loadMusicFiles(this.genre);
        }
      });
    this.calibrationService.reCalibrationCount.subscribe((count) => {
      this.globalReCalibrationCount = count;
    });
  }

  getPercentageChange(percentage: number, value: number) {
    return (percentage * Math.abs(value)) / 100 + value;
  }

  optimizeSpeed(pastNPromptsToConsider = 1) {
    const pastNPrompts = this.analytics.slice(this.analytics.length - pastNPromptsToConsider);

    if (pastNPrompts.length < pastNPromptsToConsider) {
      return;
    }

    const numOfSuccessPrompts = pastNPrompts.filter(
      (prompt) => prompt.result.type === 'success',
    ).length;
    const avgSuccess = numOfSuccessPrompts / pastNPrompts.length;

    if (avgSuccess > 0.5) {
      // decrease timeout by 10%
      this.config.speed = this.getPercentageChange(-10, this.config.speed);
      // minimum fixed speed... for better UX.
      if (this.config.speed < 1500) {
        this.config.speed = 1500;
      }
    } else {
      // increase timeout by 10%
      this.config.speed = this.getPercentageChange(10, this.config.speed);
    }
    console.log('optimizeSpeed::newSpeed:: ', this.config.speed);
  }

  factors = (num: number): number[] => [...Array(num + 1).keys()].filter((i) => num % i === 0);

  async setupConfig() {
    const settings = await this.apiService.getGameSettings('sit_stand_achieve');
    if (settings && settings.settings && settings.settings.currentLevel) {
      this.gameSettings = settings.settings;
      this.currentLevel = settings.settings.currentLevel;
      this.config.minCorrectReps =
        settings.settings.levels[this.currentLevel].configuration.minCorrectReps;
      this.config.speed = settings.settings.levels[this.currentLevel].configuration.speed;
      console.log('setup::config::', this.config);
      this.qaGameSettings = settings.settings[this.currentLevel].configuration;
      if (this.qaGameSettings) {
        if (this.qaGameSettings.minCorrectReps) {
          this.config.minCorrectReps = this.qaGameSettings.minCorrectReps;
        }
        if (this.qaGameSettings.speed) {
          this.config.speed = this.qaGameSettings.speed;
        }
        if (this.qaGameSettings.genre) {
          this.genre = this.qaGameSettings.genre;
        }
        if (this.qaGameSettings.musicSet) {
          this.sit2StandScene.currentSet = this.qaGameSettings.musicSet;
        }
      }
    } else {
      await this.apiService.insertGameSettings('sit_stand_achieve', this.gameSettings);
    }

    this.store.dispatch(
      game.saveGameSettings({ settings: { ...this.config, level: this.currentLevel } }),
    );

    this.sit2StandService.enable();
  }

  async setup() {
    // setup game config
    await this.setupConfig();
    return new Promise<void>(async (resolve, reject) => {
      console.log('Waiting for assets to Load');
      console.time('Waiting for assets to Load');
      try {
        await this.sit2StandScene.loadAssets(this.genre);
        this.gameSettings.levels[this.currentLevel].configuration.musicSet =
          this.sit2StandScene.currentSet;
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
    console.log('running welcome');

    return [
      async (reCalibrationCount: number) => {
        // start recording
        this.gameStartTime = Date.now();
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
        this.elements.ribbon.state = {
          attributes: {
            visibility: 'visible',
            reCalibrationCount,
          },
          data: {
            titles: ['A Guide to Sit, Stand, Achieve'],
          },
        };
        await this.elements.sleep(2500);
      },
      async (reCalibrationCount: number) => {
        this.elements.overlay.state = {
          attributes: {
            visibility: 'visible',
            reCalibrationCount,
          },
          data: {
            ...this.elements.overlay.state.data,
            transitionDuration: 4000,
          },
        };
        await this.elements.sleep(18000);
      },
      async (reCalibrationCount: number) => {
        this.elements.banner.state = {
          attributes: {
            visibility: 'visible',
            reCalibrationCount,
          },
          data: {
            type: 'intro',
            htmlStr: `
            <div class="w-full h-full d-flex flex-column justify-content-center align-items-center">
              <h1 class="pt-2">First Activity</h2>
              <h1 class="pt-6 display-4">Sit, Stand, Achieve</h1>
              <h1 class="pt-8" style="font-weight: 200">Area of Focus</h2>
              <h1 class="pt-2">Balance and Reaction Time</h2>
            </div>
            `,
            buttons: [
              {
                title: 'Starting Sit, Stand, Achieve',
                progressDurationMs: 5000,
              },
            ],
          },
        };
        this.ttsService.tts('Starting Sit, Stand, Achieve');
        await this.elements.sleep(7000);
      },
      async (reCalibrationCount: number) => {
        this.ttsService.tts('Please raise one of your hands to get started.');
        this.elements.guide.state = {
          data: {
            title: 'Please raise one of your hands to get started.',
            showIndefinitely: true,
          },
          attributes: {
            visibility: 'visible',
            reCalibrationCount,
          },
        };
        await this.handTrackerService.waitUntilHandRaised('any-hand');
        this.soundsService.playCalibrationSound('success');
      },
      async (reCalibrationCount: number) => {
        this.elements.guide.state = {
          data: {
            title: 'You will need a chair for this activity.',
            titleDuration: 3000,
          },
          attributes: {
            visibility: 'visible',
            reCalibrationCount,
          },
        };
        this.ttsService.tts('You will need a chair for this activity.');
      },
      async (reCalibrationCount: number) => {
        await this.elements.sleep(5000);
        let res = { result: '' };
        this.elements.guide.state = {
          data: {
            title: 'Please sit on the chair to continue.',
            showIndefinitely: true,
          },
          attributes: {
            visibility: 'visible',
            reCalibrationCount,
          },
        };
        this.ttsService.tts('Please sit on the chair to continue.');
        while (res.result !== 'success') {
          res = await this.sit2StandService.waitForClassChangeOrTimeOut('sit');
        }
      },
    ];
  }

  onboardingByLevel: { [key in GameLevels]: ((reCalibrationCount: number) => Promise<void>)[] } = {
    level1: [
      async (reCalibrationCount: number) => {
        this.elements.guide.state = {
          data: {
            title: 'This activity is a simple play on the sit to stand exercise.',
            titleDuration: 3000,
          },
          attributes: {
            visibility: 'visible',
            reCalibrationCount,
          },
        };
        this.ttsService.tts('This activity is a simple play on the sit to stand exercise');
        await this.elements.sleep(5000);

        this.elements.video.state = {
          data: {
            type: 'video',
            title: 'Odd No. = Stand Up',
            description: 'Stand up when you see an odd number on the screen.',
            src: 'assets/videos/sit-to-stand/odd.mp4',
          },
          attributes: {
            visibility: 'visible',
            reCalibrationCount,
          },
        };

        this.ttsService.tts(
          'When you see an odd number on your screen. You stand up from your seat.',
        );

        await this.elements.sleep(8000);

        this.elements.guide.state = {
          data: {
            title: 'Please raise one of your hands to continue',
            showIndefinitely: true,
          },
          attributes: {
            visibility: 'visible',
            reCalibrationCount,
          },
        };

        this.ttsService.tts('Please raise one of your hands to continue');

        await this.handTrackerService.waitUntilHandRaised('any-hand');
        this.soundsService.playCalibrationSound('success');

        this.elements.guide.state = {
          data: {},
          attributes: {
            visibility: 'hidden',
            reCalibrationCount,
          },
        };

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
            type: 'video',
            title: 'Even No. = Sit Down',
            description: 'Sit down when you see an even number on the screen.',
            src: 'assets/videos/sit-to-stand/even.mp4',
          },
          attributes: {
            visibility: 'visible',
            reCalibrationCount,
          },
        };

        this.ttsService.tts(
          'When you see an even number on your screen. You sit down on your seat.',
        );

        await this.elements.sleep(8000);

        this.elements.guide.state = {
          data: {
            title: 'Please raise one of your hands to continue',
            showIndefinitely: true,
          },
          attributes: {
            visibility: 'visible',
            reCalibrationCount,
          },
        };
        this.ttsService.tts('Please raise one of your hands to continue');
        await this.handTrackerService.waitUntilHandRaised('any-hand');
        this.soundsService.playCalibrationSound('success');
        this.elements.guide.state = {
          data: {},
          attributes: {
            visibility: 'hidden',
            reCalibrationCount,
          },
        };
        this.elements.video.state = {
          data: {},
          attributes: {
            visibility: 'hidden',
            reCalibrationCount,
          },
        };
        this.elements.guide.state = {
          data: {
            title: 'Let’s try it out.',
            titleDuration: 4000,
          },
          attributes: {
            visibility: 'visible',
            reCalibrationCount,
          },
        };
      },
      async (reCalibrationCount: number) => {
        const promptNums = [
          (Math.floor((Math.random() * 100) / 2) * 2 + 1).toString(),
          (Math.floor((Math.random() * 100) / 2) * 2).toString(),
          (Math.floor((Math.random() * 100) / 2) * 2 + 1).toString(),
          (Math.floor((Math.random() * 100) / 2) * 2).toString(),
          (Math.floor((Math.random() * 100) / 2) * 2 + 1).toString(),
        ];
        for (let i = 0; i < promptNums.length; i++) {
          if (reCalibrationCount !== this.globalReCalibrationCount) {
            throw new Error('reCalibrationCount changed');
          }
          this.elements.prompt.state = {
            data: {
              value: promptNums[i],
              position: 'center',
            },
            attributes: {
              visibility: 'visible',
              reCalibrationCount,
            },
          };
          this.ttsService.tts(promptNums[i]);
          this.elements.timeout.state = {
            data: {
              mode: 'start',
              timeout: this.config.speed,
              bars: ['yellow'],
            },
            attributes: {
              visibility: 'visible',
              reCalibrationCount,
            },
          };
          const res = await this.sit2StandService.waitForClassChangeOrTimeOut(
            parseInt(promptNums[i]) % 2 === 0 ? 'sit' : 'stand',
            this.config.speed,
          );

          this.elements.timeout.state = {
            data: {
              mode: 'stop',
            },
            attributes: {
              visibility: 'hidden',
              reCalibrationCount,
            },
          };
          this.elements.prompt.state = {
            data: {
              repStatus: res.result,
            },
            attributes: {
              visibility: 'visible',
              reCalibrationCount,
            },
          };
          if (res.result === 'failure') --i; //repeat current prompt if failure

          await this.elements.sleep(1000);
        }

        this.elements.prompt.state = {
          data: {},
          attributes: {
            visibility: 'hidden',
            reCalibrationCount,
          },
        };
      },
      async (reCalibrationCount: number) => {
        this.elements.video.state = {
          data: {
            type: 'video',
            title: 'If you see two even or odd numbers appear one after the other,',
            description: 'hold the pose until the timer runs out.',
            src: 'assets/videos/sit-to-stand/consecutive.mp4',
          },
          attributes: {
            visibility: 'visible',
            reCalibrationCount,
          },
        };

        this.ttsService.tts(
          'If you see two even or odd numbers appear one after the other, hold the pose until the timer runs out.',
        );
        await this.elements.sleep(10000);
        this.elements.video.state = {
          data: {},
          attributes: {
            visibility: 'hidden',
            reCalibrationCount,
          },
        };

        const promptNums = [
          (Math.floor((Math.random() * 100) / 2) * 2 + 1).toString(),
          (Math.floor((Math.random() * 100) / 2) * 2).toString(),
          (Math.floor((Math.random() * 100) / 2) * 2).toString(),
        ];
        for (let i = 0; i < promptNums.length; i++) {
          if (reCalibrationCount !== this.globalReCalibrationCount) {
            throw new Error('reCalibrationCount changed');
          }
          this.elements.prompt.state = {
            data: {
              value: promptNums[i],
            },
            attributes: {
              visibility: 'visible',
              reCalibrationCount,
            },
          };
          this.ttsService.tts(promptNums[i]);
          this.elements.timeout.state = {
            data: {
              mode: 'start',
              timeout: this.config.speed,
              bars: ['yellow'],
            },
            attributes: {
              visibility: 'visible',
              reCalibrationCount,
            },
          };
          const res = await this.sit2StandService.waitForClassChangeOrTimeOut(
            parseInt(promptNums[i]) % 2 === 0 ? 'sit' : 'stand',
            this.config.speed,
          );
          this.elements.timeout.state = {
            data: {
              mode: 'stop',
            },
            attributes: {
              visibility: 'hidden',
              reCalibrationCount,
            },
          };
          this.elements.prompt.state = {
            data: {
              repStatus: res.result,
            },
            attributes: {
              visibility: 'visible',
              reCalibrationCount,
            },
          };
          if (res.result === 'failure') --i;
          await this.elements.sleep(1000);
        }
        this.elements.prompt.attributes = {
          visibility: 'hidden',
          reCalibrationCount,
        };
        this.elements.guide.state = {
          data: {
            title: "Great job, looks like you're getting the hang of it.",
            titleDuration: 8000,
          },
          attributes: {
            visibility: 'visible',
            reCalibrationCount,
          },
        };
        this.ttsService.tts("Great job, looks like you're getting the hang of it");
        await this.elements.sleep(8000);
      },
      async (reCalibrationCount: number) => {
        this.elements.ribbon.state = {
          data: {
            titles: ["Let's get 5 correct repetitions", '3', '2', '1', 'Go!'],
          },
          attributes: {
            visibility: 'visible',
            reCalibrationCount,
          },
        };
        await this.elements.sleep(14000);

        this.elements.score.state = {
          data: {
            label: 'Motion',
            value: '0',
            goal: '5',
          },
          attributes: {
            visibility: 'visible',
            reCalibrationCount,
          },
        };

        const repsToComplete = 5;
        let successfulReps = 0;
        const prevPrompts: { class: 'sit' | 'stand' }[] = [];
        while (successfulReps < repsToComplete) {
          if (reCalibrationCount !== this.globalReCalibrationCount) {
            throw new Error('reCalibrationCount changed');
          }
          let promptNum = Math.floor(Math.random() * 100);
          if (prevPrompts && prevPrompts.length >= 2) {
            const prevReps = prevPrompts.slice(-2);
            if (prevReps[0].class === prevReps[1].class) {
              prevReps[0].class === 'sit'
                ? (promptNum = Math.floor((Math.random() * 100) / 2) * 2 + 1)
                : (promptNum = Math.floor((Math.random() * 100) / 2) * 2);
            }
          }
          const promptClass = promptNum % 2 === 0 ? 'sit' : 'stand';

          this.elements.prompt.state = {
            data: {
              value: promptNum,
            },
            attributes: {
              visibility: 'visible',
              reCalibrationCount,
            },
          };
          this.ttsService.tts(promptNum.toString());
          this.elements.timeout.state = {
            data: {
              mode: 'start',
              timeout: this.config.speed,
              bars: ['yellow'],
            },
            attributes: {
              visibility: 'visible',
              reCalibrationCount,
            },
          };
          const res = await this.sit2StandService.waitForClassChangeOrTimeOut(
            promptClass,
            this.config.speed,
          );
          this.elements.timeout.state = {
            data: {
              mode: 'stop',
            },
            attributes: {
              visibility: 'hidden',
              reCalibrationCount,
            },
          };
          prevPrompts.push({
            class: promptClass,
          });
          this.elements.prompt.state = {
            data: {
              repStatus: res.result,
            },
            attributes: {
              visibility: 'visible',
              reCalibrationCount,
            },
          };
          if (res.result === 'success') {
            successfulReps += 1;
            this.elements.score.state = {
              data: {
                label: 'Motion',
                value: successfulReps,
                goal: repsToComplete,
              },
              attributes: {
                visibility: 'visible',
                reCalibrationCount,
              },
            };
          }
          await this.elements.sleep(1000);
        }
        this.elements.prompt.attributes = {
          visibility: 'hidden',
          reCalibrationCount,
        };
        this.elements.score.state = {
          data: {},
          attributes: {
            visibility: 'hidden',
            reCalibrationCount,
          },
        };
        this.elements.ribbon.state = {
          data: {
            titles: ['Guide completed'],
          },
          attributes: {
            visibility: 'visible',
            reCalibrationCount,
          },
        };
        this.ttsService.tts('Guide completed');
        await this.elements.sleep(3400);
      },
    ],
    level2: [
      async (reCalibrationCount: number) => {
        this.elements.guide.state = {
          data: {
            title: 'Welcome to Level 2 of Sit to Stand.',
            titleDuration: 4000,
          },
          attributes: {
            visibility: 'visible',
            reCalibrationCount,
          },
        };
        this.ttsService.tts('Welcome to Level 2 of Sit to Stand');
        await this.elements.sleep(4000);
        this.elements.guide.state = {
          data: {
            title: "I'm going to give you a simple mathematical problem.",
            titleDuration: 4000,
          },
          attributes: {
            visibility: 'visible',
            reCalibrationCount,
          },
        };
        this.ttsService.tts("I'm going to give you a simple mathematical problem");
        await this.elements.sleep(4000);
        this.elements.guide.state = {
          data: {
            title: "In this level we'll be doing addition and subtraction.",
            titleDuration: 5000,
          },
          attributes: {
            visibility: 'visible',
            reCalibrationCount,
          },
        };
        this.ttsService.tts("In this level we'll be doing addition and subtraction");
        await this.elements.sleep(5000);
      },
      async (reCalibrationCount: number) => {
        this.elements.video.state = {
          data: {
            type: 'video',
            title: 'Odd No. = Stand Up',
            description: 'Stand up if the answer is an odd number.',
            src: 'assets/videos/sit-to-stand/odd.mp4',
          },
          attributes: {
            visibility: 'visible',
            reCalibrationCount,
          },
        };

        this.ttsService.tts('Stand up if the answer is an odd number.');

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
            type: 'video',
            title: 'Even No. = Sit Down',
            description: 'Sit down if the answer is an even number.',
            src: 'assets/videos/sit-to-stand/even.mp4',
          },
          attributes: {
            visibility: 'visible',
            reCalibrationCount,
          },
        };

        this.ttsService.tts('Sit down if the answer is an even number.');
        await this.elements.sleep(8000);

        this.elements.video.state = {
          data: {},
          attributes: {
            visibility: 'hidden',
            reCalibrationCount,
          },
        };

        await this.elements.sleep(3000);

        this.elements.guide.state = {
          data: {
            title: 'Let’s try it out.',
            titleDuration: 3000,
          },
          attributes: {
            visibility: 'visible',
            reCalibrationCount,
          },
        };
        this.ttsService.tts('Let’s try it out.');
        await this.elements.sleep(3000);
      },
      async (reCalibrationCount: number) => {
        const promptExpressions = ['4+8', '9-6'];

        for (let i = 0; i < promptExpressions.length; i++) {
          if (reCalibrationCount !== this.globalReCalibrationCount) {
            throw new Error('reCalibrationCount changed');
          }
          this.elements.prompt.state = {
            data: {
              value: promptExpressions[i],
              position: 'center',
            },
            attributes: {
              visibility: 'visible',
              reCalibrationCount,
            },
          };
          const ttsExpression = promptExpressions[i].replace('-', ' minus ').replace('+', ' plus ');
          this.ttsService.tts(ttsExpression);
          this.elements.timeout.state = {
            data: {
              mode: 'start',
              timeout: this.config.speed,
              bars: ['yellow'],
            },
            attributes: {
              visibility: 'visible',
              reCalibrationCount,
            },
          };
          const res = await this.sit2StandService.waitForClassChangeOrTimeOut(
            eval(promptExpressions[i]) % 2 === 0 ? 'sit' : 'stand',
            this.config.speed,
          );

          this.elements.timeout.state = {
            data: {
              mode: 'stop',
            },
            attributes: {
              visibility: 'hidden',
              reCalibrationCount,
            },
          };
          this.elements.prompt.state = {
            data: {
              repStatus: res.result,
            },
            attributes: {
              visibility: 'visible',
              reCalibrationCount,
            },
          };
          if (res.result === 'failure') --i; //repeat current prompt if failure

          await this.elements.sleep(1000);
        }

        this.elements.prompt.state = {
          data: {},
          attributes: {
            visibility: 'hidden',
            reCalibrationCount,
          },
        };

        this.elements.guide.state = {
          data: {
            title: 'Tutorial Completed.',
            titleDuration: 3000,
          },
          attributes: {
            visibility: 'visible',
            reCalibrationCount,
          },
        };
        this.ttsService.tts('Tutorial Completed.');
        await this.elements.sleep(3000);
      },
    ],
    level3: [
      async (reCalibrationCount: number) => {
        this.elements.guide.state = {
          data: {
            title: 'Welcome to Level 3 of Sit to Stand.',
            titleDuration: 4000,
          },
          attributes: {
            visibility: 'visible',
            reCalibrationCount,
          },
        };
        this.ttsService.tts('Welcome to Level 3 of Sit to Stand');
        await this.elements.sleep(4000);
        this.elements.guide.state = {
          data: {
            title: "I'm going to give you a simple mathematical problem.",
            titleDuration: 4000,
          },
          attributes: {
            visibility: 'visible',
            reCalibrationCount,
          },
        };
        this.ttsService.tts("I'm going to give you a simple mathematical problem");
        await this.elements.sleep(4000);
        this.elements.guide.state = {
          data: {
            title: "In this level we'll be doing multiplication and division.",
            titleDuration: 5000,
          },
          attributes: {
            visibility: 'visible',
            reCalibrationCount,
          },
        };
        this.ttsService.tts("In this level we'll be doing multiplication and division");
        await this.elements.sleep(5000);
      },
      async (reCalibrationCount: number) => {
        this.elements.video.state = {
          data: {
            type: 'video',
            title: 'Odd No. = Stand Up',
            description: 'Stand up if the answer is an odd number.',
            src: 'assets/videos/sit-to-stand/odd.mp4',
          },
          attributes: {
            visibility: 'visible',
            reCalibrationCount,
          },
        };

        this.ttsService.tts('Stand up if the answer is an odd number.');

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
            type: 'video',
            title: 'Even No. = Sit Down',
            description: 'Sit down if the answer is an even number.',
            src: 'assets/videos/sit-to-stand/even.mp4',
          },
          attributes: {
            visibility: 'visible',
            reCalibrationCount,
          },
        };

        this.ttsService.tts('Sit down if the answer is an even number.');
        await this.elements.sleep(8000);

        this.elements.video.state = {
          data: {},
          attributes: {
            visibility: 'hidden',
            reCalibrationCount,
          },
        };

        await this.elements.sleep(3000);

        this.elements.guide.state = {
          data: {
            title: 'Let’s try it out.',
            titleDuration: 3000,
          },
          attributes: {
            visibility: 'visible',
            reCalibrationCount,
          },
        };
        this.ttsService.tts('Let’s try it out.');
        await this.elements.sleep(3000);
      },
      async (reCalibrationCount: number) => {
        const promptExpressions = ['2*8', '9/3'];

        for (let i = 0; i < promptExpressions.length; i++) {
          if (reCalibrationCount !== this.globalReCalibrationCount) {
            throw new Error('reCalibrationCount changed');
          }
          this.elements.prompt.state = {
            data: {
              value: promptExpressions[i],
              position: 'center',
            },
            attributes: {
              visibility: 'visible',
              reCalibrationCount,
            },
          };
          const ttsExpression = promptExpressions[i]
            .replace('*', ' multiplied with ')
            .replace('/', ' divided by ');
          this.ttsService.tts(ttsExpression);
          this.elements.timeout.state = {
            data: {
              mode: 'start',
              timeout: this.config.speed,
              bars: ['yellow'],
            },
            attributes: {
              visibility: 'visible',
              reCalibrationCount,
            },
          };
          const res = await this.sit2StandService.waitForClassChangeOrTimeOut(
            eval(promptExpressions[i]) % 2 === 0 ? 'sit' : 'stand',
            this.config.speed,
          );

          this.elements.timeout.state = {
            data: {
              mode: 'stop',
            },
            attributes: {
              visibility: 'hidden',
              reCalibrationCount,
            },
          };
          this.elements.prompt.state = {
            data: {
              repStatus: res.result,
            },
            attributes: {
              visibility: 'visible',
              reCalibrationCount,
            },
          };
          if (res.result === 'failure') --i; //repeat current prompt if failure

          await this.elements.sleep(1000);
        }

        this.elements.prompt.state = {
          data: {},
          attributes: {
            visibility: 'hidden',
            reCalibrationCount,
          },
        };

        this.elements.guide.state = {
          data: {
            title: 'Tutorial Completed.',
            titleDuration: 3000,
          },
          attributes: {
            visibility: 'visible',
            reCalibrationCount,
          },
        };
        this.ttsService.tts('Tutorial Completed.');
        await this.elements.sleep(3000);
      },
    ],
  };

  tutorial() {
    console.log('running tutorial');
    return [
      async (reCalibrationCount: number) => {
        console.log('current level: ', this.currentLevel);
        this.soundsService.playActivityInstructionSound(this.genre);
        this.elements.guide.state = {
          data: {
            title: "Great, let's begin.",
            titleDuration: 3000,
          },
          attributes: {
            visibility: 'visible',
            reCalibrationCount,
          },
        };
        this.ttsService.tts("Great, let's begin.");
        await this.elements.sleep(5000);
      },
      ...this.onboardingByLevel[this.currentLevel],
      async () => {
        await this.apiService.updateOnboardingStatus({
          sit_stand_achieve: true,
        });
        this.soundsService.stopActivityInstructionSound(this.genre);
      },
    ];
  }

  preLoop() {
    return [];
  }

  async showPrompt(
    promptNum: number,
    promptId: string,
    analytics: any[],
    reCalibrationCount?: number,
    stringExpression?: string,
  ) {
    const promptClass = promptNum % 2 === 0 ? 'sit' : 'stand';

    this.elements.prompt.state = {
      data: {
        value: stringExpression?.replace('*', 'x') || promptNum,
      },
      attributes: {
        visibility: 'visible',
        ...(typeof reCalibrationCount === 'number' && { reCalibrationCount }),
      },
    };
    const promptTimestamp = Date.now();
    const ttsExpression = stringExpression
      ?.replace('-', ' minus ')
      .replace('+', ' plus ')
      .replace('/', ' divided by ')
      .replace('*', ' multiplied with ');

    const backtrack = this.sit2StandScene.getBacktrack(this.genre);
    await this.ttsService.tts(ttsExpression || promptNum.toString(), backtrack);

    this.elements.timeout.state = {
      data: {
        mode: 'start',
        timeout: this.config.speed,
        bars: ['yellow'],
      },
      attributes: {
        visibility: 'visible',
        ...(typeof reCalibrationCount === 'number' && { reCalibrationCount }),
      },
    };
    const res = await this.sit2StandService.waitForClassChangeOrTimeOut(
      promptClass,
      this.config.speed,
    );
    const resultTimestamp = Date.now();
    console.log(
      'promptNum: ',
      promptNum,
      'promptClass: ',
      promptClass,
      'patientClass: ',
      res.currentClass,
      'stringExpression: ',
      stringExpression,
      'res: ',
      res,
    );
    this.totalReps += 1;
    this.elements.timeout.state = {
      data: {
        mode: 'stop',
      },
      attributes: {
        visibility: 'hidden',
        ...(typeof reCalibrationCount === 'number' && { reCalibrationCount }),
      },
    };
    const hasUserStateChanged: boolean =
      analytics.length > 0 ? analytics.slice(-1)[0].reaction.type !== res.currentClass : true;
    const analyticsObj = {
      prompt: {
        id: promptId,
        type: promptClass,
        timestamp: promptTimestamp,
        data: {
          number: promptNum,
          ...(stringExpression ? { stringExpression } : {}),
        },
      },
      reaction: {
        type: res.currentClass,
        timestamp: Date.now(),
        startTime: Date.now(),
        completionTimeInMs: hasUserStateChanged
          ? Math.abs(resultTimestamp - promptTimestamp)
          : null, // milliseconds between reaction and result if user state changed
      },
      result: {
        type: res.result,
        timestamp: resultTimestamp,
        score: res.result === 'success' ? 1 : 0,
      },
    };

    return { res, analyticsObj };
  }
  private getRandomPromptExpression() {
    let stringExpression;

    if (this.currentLevel === 'level2') {
      const isSumOperation = Math.random() > 0.5;

      const num1 = Math.floor(Math.random() * 9);
      const num2 = Math.floor(isSumOperation ? Math.random() * 9 : Math.random() * num1);

      stringExpression = num1 + (isSumOperation ? '+' : '-') + num2;
    } else if (this.currentLevel === 'level3') {
      const isDivisionOperation = Math.random() > 0.5;

      const num1 = Math.floor(Math.random() * 9);

      const num1Factors = this.factors(num1);
      const randomFactor =
        num1 === 0 ? 1 : num1Factors[Math.floor(Math.random() * num1Factors.length)];

      const num2 = Math.floor(isDivisionOperation ? randomFactor : Math.random() * 9);

      stringExpression = num1 + (isDivisionOperation ? '/' : '*') + num2;
    }
    const promptNum = stringExpression ? eval(stringExpression) : Math.floor(Math.random() * 100);

    return { promptNum, stringExpression };
  }

  private async game(reCalibrationCount?: number) {
    this.sit2StandScene.enableMusic();
    while (this.successfulReps < this.targetReps!) {
      if (reCalibrationCount !== this.globalReCalibrationCount) {
        throw new Error('reCalibrationCount changed');
      }
      // generating a prompt number
      const result = this.getRandomPromptExpression();
      let promptNum = result.promptNum;
      let stringExpression = result.stringExpression;

      // checking if not more than two even or two odd in a row.
      if (this.analytics && this.analytics.length >= 2) {
        const prevReps = this.analytics.slice(-2);
        if (prevReps[0].prompt.type === prevReps[1].prompt.type) {
          // if two even or two odd in a row, we generate the opposite class number.
          if (this.currentLevel === 'level1') {
            prevReps[0].prompt.type === 'sit'
              ? (promptNum = Math.floor((Math.random() * 100) / 2) * 2 + 1)
              : (promptNum = Math.floor((Math.random() * 100) / 2) * 2);
          } else {
            // for level 2 and 3
            if (prevReps[0].prompt.type === 'sit') {
              do {
                const result = this.getRandomPromptExpression();
                promptNum = result.promptNum;
                stringExpression = result.stringExpression;
              } while (promptNum % 2 === 0);
            } else {
              do {
                const result = this.getRandomPromptExpression();
                promptNum = result.promptNum;
                stringExpression = result.stringExpression;
              } while (promptNum % 2 !== 0);
            }
          }
        }
      }
      const promptId = uuidv4();
      const { res, analyticsObj } = await this.showPrompt(
        promptNum,
        promptId,
        this.analytics,
        reCalibrationCount,
        stringExpression,
      );
      this.analytics.push(analyticsObj);

      if (
        this.analytics.length >= 2 &&
        this.analytics.slice(this.analytics.length - 2)[0].prompt.type !=
          this.analytics.slice(this.analytics.length - 2)[1].prompt.type
      ) {
        this.optimizeSpeed();
      }

      this.store.dispatch(game.pushAnalytics({ analytics: [analyticsObj] }));
      if (res.result === 'success') {
        this.sit2StandScene.playTrigger(this.genre);
        this.elements.prompt.state = {
          data: {
            repStatus: res.result,
          },
          attributes: {
            visibility: 'visible',
            reCalibrationCount,
          },
        };
        this.successfulReps += 1;
        this.failedReps = 0;
        this.store.dispatch(game.repCompleted({ repsCompleted: this.successfulReps }));
        this.elements.score.state = {
          data: {
            label: 'Motion',
            value: this.successfulReps.toString(),
          },
          attributes: {
            visibility: 'visible',
            reCalibrationCount,
          },
        };

        if (++this.streak === this.levelUpStreak) this.shouldLevelUp = true;
      } else {
        this.soundsService.playCalibrationSound('error');
        this.elements.prompt.state = {
          data: {
            repStatus: res.result,
          },
          attributes: {
            visibility: 'visible',
            reCalibrationCount,
          },
        };
        this.failedReps += 1;
        this.streak = 0;
        if (this.failedReps >= 3) {
          // for better user experience - increase timeout duration by 2 second.
          this.config.speed += 2000;
          this.elements.timer.state = {
            data: {
              mode: 'pause',
            },
            attributes: {
              visibility: 'visible',
              reCalibrationCount,
            },
          };
          this.elements.prompt.attributes = {
            visibility: 'hidden',
            reCalibrationCount,
          };
          await this.elements.sleep(2000);
          // walkthrough
          this.elements.banner.state = {
            data: {
              htmlStr: `
              <div class="w-full h-full position-absolute translate-middle top-1/2 start-1/2 rounded-4 d-flex align-items-center flex-column justify-content-center bg-info ">
                <div class='p-4 d-flex flex-row align-items-center'>
                      <img style='width:250px;height:250px;' src='assets/images/overlay_icons/Standing Man.png' alt="standing man"/>
                      <div class='bg-success p-6 display-4 text-white rounded-3 mx-4'>1</div>
                      <div class='bg-success p-6 display-4 text-white rounded-3 mx-4'>17</div>
                      <div class='bg-success p-6 display-4 text-white rounded-3 mx-4'>23</div>
                </div>
                <div>
                  <hr style="border: 2px solid #A0AEC0;">
                  <p class=" display-5 text-white">Odd Number - Stand Up</p>
                </div>
              </div>
          `,
            },
            attributes: {
              visibility: 'visible',
              reCalibrationCount,
            },
          };
          await this.elements.sleep(5000);
          this.elements.banner.attributes = {
            visibility: 'hidden',
            reCalibrationCount,
          };
          await this.elements.sleep(2000);
          this.elements.banner.state = {
            data: {
              htmlStr: `
                  <div class="w-full h-full position-absolute translate-middle top-1/2 start-1/2 rounded-4 d-flex align-items-center flex-column justify-content-center bg-info ">
                    <div class='p-4 d-flex flex-row align-items-center'>
                          <img style='width:250px;height:250px;' src='assets/images/overlay_icons/Sitting on Chair.png' alt="sitting on chair"/>
                          <div class='bg-success p-6 display-4 text-white rounded-3 mx-4'>2</div>
                          <div class='bg-success p-6 display-4 text-white rounded-3 mx-4'>14</div>
                          <div class='bg-success p-6 display-4 text-white rounded-3 mx-4'>38</div>
                    </div>
                    <div>
                      <hr style="border: 2px solid #A0AEC0;">
                      <p class=" display-5 text-white">Even Number - Sit Down</p>
                    </div>
                  </div>
              `,
            },
            attributes: {
              visibility: 'visible',
              reCalibrationCount,
            },
          };
          await this.elements.sleep(5000);
          this.elements.banner.attributes = {
            visibility: 'hidden',
            reCalibrationCount,
          };
          await this.elements.sleep(2000);
          this.elements.timer.state = {
            data: {
              mode: 'resume',
            },
            attributes: {
              visibility: 'visible',
              reCalibrationCount,
            },
          };
        }
      }
      await this.elements.sleep(1000);
      this.elements.prompt.state = {
        data: {},
        attributes: {
          visibility: 'hidden',
          reCalibrationCount,
        },
      };
    }
  }

  loop() {
    return [
      async (reCalibrationCount: number) => {
        this.loopStartTime = Date.now();
        this.elements.guide.state = {
          data: {
            showIndefinitely: true,
            title: 'Raise one of your hands to continue.',
          },
          attributes: {
            visibility: 'visible',
            reCalibrationCount,
          },
        };
        this.ttsService.tts('Raise one of your hands to continue');
        await this.handTrackerService.waitUntilHandRaised('any-hand');
        this.firstPromptTime = Date.now();
        this.soundsService.playCalibrationSound('success');
        this.elements.guide.state = {
          data: {},
          attributes: {
            visibility: 'hidden',
            reCalibrationCount,
          },
        };
      },
      async (reCalibrationCount: number) => {
        this.sit2StandScene.playBacktrack(this.genre);
        this.elements.score.state = {
          data: {
            label: 'Motion',
            value: 0,
          },
          attributes: {
            visibility: 'visible',
            reCalibrationCount,
          },
        };
        const updateElapsedTime = (elapsedTime: number) => {
          this.totalDuration += elapsedTime;
          this.store.dispatch(game.setTotalElapsedTime({ totalDuration: this.totalDuration }));
        };
        this.elements.timer.state = {
          data: {
            mode: 'start',
            duration: 60 * 60 * 1000,
            onPause: updateElapsedTime,
            onComplete: updateElapsedTime,
          },
          attributes: {
            visibility: 'visible',
            reCalibrationCount,
          },
        };

        const startResult: 'success' | 'failure' = 'success';
        const startPrompt = {
          prompt: {
            id: uuidv4(),
            type: 'start',
            timestamp: Date.now(),
            data: {
              gameStartTime: this.gameStartTime,
              loopStartTime: this.loopStartTime,
              firstPromptTime: this.firstPromptTime,
            },
          },
          reaction: {
            type: 'start',
            timestamp: Date.now(),
            startTime: Date.now(),
            completionTimeInMs: 0,
          },
          result: {
            type: startResult,
            timestamp: Date.now(),
            score: 0,
          },
        };
        this.analytics.push(startPrompt);
        this.store.dispatch(game.pushAnalytics({ analytics: [startPrompt] }));
      },
      async (reCalibrationCount: number) => {
        await this.game(reCalibrationCount);
        this.elements.timer.state = {
          data: {
            mode: 'stop',
          },
          attributes: {
            visibility: 'hidden',
            reCalibrationCount,
          },
        };
        this.elements.score.state = {
          data: {},
          attributes: {
            visibility: 'hidden',
            reCalibrationCount,
          },
        };
      },
      async (reCalibrationCount: number) => {
        let totalDuration: number | undefined;
        this.store
          .pipe(take(1))
          .subscribe(async (state) => (totalDuration = state.game.totalDuration!));
        const fastestTimeInSecs = await this.apiService.getFastestTime('sit_stand_achieve');

        const shouldAllowReplay =
          Math.abs(fastestTimeInSecs - (totalDuration || 0)) <= 5 || Math.random() < 0.5;

        if (!shouldAllowReplay) return;

        this.ttsService.tts(
          'Raise both your hands if you want to add 10 more reps to this activity.',
        );
        this.elements.guide.state = {
          data: {
            title: 'Raise both your hands to add 10 reps.',
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
                <button class="btn btn-primary d-flex align-items-center progress col mx-16"><span class="m-auto d-inline-block">Add 10 more reps</span></button>
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
        this.shouldReplay = await this.handTrackerService.replayOrTimeout(10000);
        if (typeof this.qaGameSettings?.extendGameDuration === 'boolean') {
          this.shouldReplay = this.qaGameSettings.extendGameDuration;
        }
        this.gameSettings.levels[this.currentLevel].configuration.extendGameDuration =
          this.shouldReplay;
        this.elements.banner.attributes = {
          visibility: 'hidden',
          reCalibrationCount,
        };
        this.elements.guide.attributes = {
          visibility: 'hidden',
          reCalibrationCount,
        };
        if (this.shouldReplay) {
          this.soundsService.playCalibrationSound('success');

          this.targetReps! += 10;

          const updateElapsedTime = (elapsedTime: number) => {
            this.totalDuration += elapsedTime;
            this.store.dispatch(game.setTotalElapsedTime({ totalDuration: this.totalDuration }));
          };
          this.elements.timer.state = {
            data: {
              mode: 'start',
              duration: 60 * 60 * 1000,
              onPause: updateElapsedTime,
              onComplete: updateElapsedTime,
            },
            attributes: {
              visibility: 'visible',
              reCalibrationCount,
            },
          };
        }
      },
      async (reCalibrationCount: number) => {
        await this.game(reCalibrationCount);
        this.elements.timer.state = {
          data: {
            mode: 'stop',
          },
          attributes: {
            visibility: 'hidden',
            reCalibrationCount,
          },
        };
        this.elements.score.state = {
          data: {},
          attributes: {
            visibility: 'hidden',
            reCalibrationCount,
          },
        };
      },
    ];
  }

  stopGame() {
    this.sit2StandScene.stopBacktrack(this.genre);
    this.sit2StandScene.enableMusic(false);
    this.apiService.updateGameSettings('sit_stand_achieve', this.gameSettings);
  }

  postLoop() {
    console.log('running Sit,Stand,Achieve postLoop');
    return [
      async (reCalibrationCount: number) => {
        this.stopGame();
        // this.soundsService.stopGenreSound();
        const achievementRatio = this.successfulReps / this.totalReps;
        const nextLevel = Number(this.currentLevel.charAt(this.currentLevel.length - 1)) + 1;
        if (achievementRatio < 0.6 || (this.shouldLevelUp && nextLevel <= 3)) {
          await this.apiService.updateOnboardingStatus({
            sit_stand_achieve: false,
          });
        }

        console.log('updating game settings:', this.gameSettings);
        this.gameSettings.levels[this.currentLevel].configuration.speed = this.config.speed;
        await this.apiService.updateGameSettings('sit_stand_achieve', this.gameSettings);

        if (this.shouldLevelUp && nextLevel <= 3) {
          this.currentLevel = ('level' + nextLevel) as GameLevels;
          this.gameSettings.currentLevel = this.currentLevel;

          this.elements.guide.state = {
            data: {
              title: "Congratulations, you've progressed to the next level.",
              titleDuration: 5000,
            },
            attributes: {
              visibility: 'visible',
              reCalibrationCount,
            },
          };
          this.ttsService.tts("Congratulations, you've progressed to the next level.");
          await this.elements.sleep(5000);

          this.elements.guide.state = {
            data: {
              title: "Hope you're ready for a new challenge tomorrow.",
              titleDuration: 3000,
            },
            attributes: {
              visibility: 'visible',
              reCalibrationCount,
            },
          };
          this.ttsService.tts("Hope you're ready for a new challenge tomorrow.");
          await this.elements.sleep(3000);
        }

        let totalDuration: {
          minutes: string;
          seconds: string;
        };
        this.store.pipe(take(1)).subscribe(async (state) => {
          totalDuration = this.sit2StandService.updateTimer(state.game.totalDuration || 0);
          const fastestTimeInSecs = await this.apiService.getFastestTime('sit_stand_achieve');
          console.log('fastest: ', fastestTimeInSecs);
          const fastestTime = this.sit2StandService.updateTimer(
            Math.min(fastestTimeInSecs || Number.MAX_VALUE, state.game.totalDuration!),
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
              <h1 class="pt-8 display-3">Sit, Stand, Achieve</h1>
              <h2 class="pt-7">Time: ${totalDuration.minutes}:${totalDuration.seconds} minutes</h2>
              <h2 class="pt-5">Fastest Time: ${fastestTime.minutes}:${fastestTime.seconds} minutes</h2>
              <h2 class="pt-5">Motion Completed: ${this.successfulReps}</h2>
            <div>
            `,
              buttons: [
                {
                  title: 'Next Activity',
                  progressDurationMs: 10000,
                },
              ],
            },
          };
        });
        await this.elements.sleep(12000);
      },
    ];
  }
}
