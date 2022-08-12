import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import { take } from 'rxjs';
import {
  ActivityBase,
  AnalyticsDTO,
  GameState,
  Genre,
  HandTrackerStatus,
  PreferenceState,
} from 'src/app/types/pointmotion';
import { HandTrackerService } from '../../classifiers/hand-tracker/hand-tracker.service';
import { ElementsService } from '../../elements/elements.service';
import { GameStateService } from '../../game-state/game-state.service';
import { SitToStandService as Sit2StandService } from '../../classifiers/sit-to-stand/sit-to-stand.service';
import { SoundsService } from '../../sounds/sounds.service';
import { environment } from 'src/environments/environment';
import { game } from 'src/app/store/actions/game.actions';
import { TtsService } from '../../tts/tts.service';
import { CheckinService } from '../../checkin/checkin.service';
import { CalibrationService } from '../../calibration/calibration.service';
@Injectable({
  providedIn: 'root',
})
export class SitToStandService implements ActivityBase {
  _handTrackerStatus: HandTrackerStatus;
  private genre: Genre = 'jazz';
  private successfulReps = 0;
  private failedReps = 0;
  private totalReps = 0;
  private globalReCalibrationCount: number;
  private config = {
    minCorrectReps: environment.settings['sit_stand_achieve'].configuration.minCorrectReps,
    speed: environment.settings['sit_stand_achieve'].configuration.speed,
  };
  private analytics: AnalyticsDTO[] = [];

  constructor(
    private store: Store<{
      game: GameState;
      preference: PreferenceState;
    }>,
    private elements: ElementsService,
    private gameStateService: GameStateService,
    private handTrackerService: HandTrackerService,
    private sit2StandService: Sit2StandService,
    private soundsService: SoundsService,
    private ttsService: TtsService,
    private calibrationService: CalibrationService,
    private checkinService: CheckinService,
  ) {
    this.store
      .select((state) => state.game)
      .subscribe((game) => {
        if (game.id) {
          // Update the game state whenever redux state changes
          const { id, ...gameState } = game;
          this.gameStateService.updateGame(id, gameState);
        }
      });

    this.store
      .select((state) => state.preference)
      .subscribe((preference) => {
        if (preference.genre && this.genre !== preference.genre) {
          this.genre = preference.genre;
          this.soundsService.loadMusicFiles(this.genre);
        }
      });

    this.handTrackerService.enable();
    this.sit2StandService.enable();
    // Register this service with with something...

    calibrationService.reCalibrationCount.subscribe((count) => {
      this.globalReCalibrationCount = count;
    });
  }

  welcome() {
    console.log('running welcome');
    return [
      async (reCalibrationCount: number) => {
        this.elements.ribbon.state = {
          attributes: {
            visibility: 'visible',
            reCalibrationCount,
          },
          data: {
            titles: ['Next Activity', 'Sit, Stand, Achieve'],
          },
        };
        await this.elements.sleep(6000);
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
              <h1 class="py-2">Balance and Reaction Time</h2>
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
        this.ttsService.tts('Please raise your left hand to get started.');
        this.elements.guide.state = {
          data: {
            title: 'Please raise your left hand to get started.',
            showIndefinitely: true,
          },
          attributes: {
            visibility: 'visible',
            reCalibrationCount,
          },
        };
        await this.handTrackerService.waitUntilHandRaised('left-hand');
        this.soundsService.playCalibrationSound('success');
      },
    ];
  }

  tutorial() {
    console.log('running tutorial');
    return [
      async (reCalibrationCount: number) => {
        this.soundsService.playActivityInstructionSound(this.genre);
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
        await this.elements.sleep(5000);
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
        const res = await this.sit2StandService.waitForClassChangeOrTimeOut('sit');
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
            src: 'assets/videos/sit-to-stand/odd_num.mp4',
          },
          attributes: {
            visibility: 'visible',
            reCalibrationCount,
          },
        };

        this.ttsService.tts(
          'An Odd number is any number ending with 1 3 5 7 9. Stand up when you see an Odd Number.',
        );

        await this.elements.sleep(8000);

        this.elements.guide.state = {
          data: {
            title: 'Please raise your left hand to move further',
            showIndefinitely: true,
          },
          attributes: {
            visibility: 'visible',
            reCalibrationCount,
          },
        };

        this.ttsService.tts('Please raise your left hand to move further');

        await this.handTrackerService.waitUntilHandRaised('left-hand');
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
            src: 'assets/videos/sit-to-stand/even_num.mp4',
          },
          attributes: {
            visibility: 'visible',
            reCalibrationCount,
          },
        };

        this.ttsService.tts(
          'An Even number is any number ending with 0 2 4 6 8. Sit down when you see an Even Number.',
        );

        await this.elements.sleep(8000);

        this.elements.guide.state = {
          data: {
            title: 'Please raise your left hand to move further',
            showIndefinitely: true,
          },
          attributes: {
            visibility: 'visible',
            reCalibrationCount,
          },
        };
        this.ttsService.tts('Please raise your left hand to move further');
        await this.handTrackerService.waitUntilHandRaised('left-hand');
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
            title: 'When consecutive even or odd numbers appear.',
            description: 'Continue sitting or standing until the timer below runs out.',
            src: 'assets/videos/sit-to-stand/consecutive_case.mp4',
          },
          attributes: {
            visibility: 'visible',
            reCalibrationCount,
          },
        };

        this.ttsService.tts(
          'When consecutive even or odd numbers appear Continue sitting or standing until the timer below runs out',
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
        await this.checkinService.updateOnboardingStatus({
          sit_stand_achieve: true,
        });
        this.soundsService.pauseActivityInstructionSound(this.genre);
      },
    ];
  }

  preLoop() {
    return [];
  }

  loop() {
    return [
      async (reCalibrationCount: number) => {
        this.elements.guide.state = {
          data: {
            showIndefinitely: true,
            title: 'Raise your left hand to move further.',
          },
          attributes: {
            visibility: 'visible',
            reCalibrationCount,
          },
        };
        this.ttsService.tts('Raise your left hand to move further');
        await this.handTrackerService.waitUntilHandRaised('left-hand');
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
        this.soundsService.playMusic(this.genre, 'backtrack');
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
          this.store.dispatch(game.setTotalElapsedTime({ totalDuration: elapsedTime }));
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
      },
      async (reCalibrationCount: number) => {
        while (this.successfulReps < this.config.minCorrectReps!) {
          if (reCalibrationCount !== this.globalReCalibrationCount) {
            throw new Error('reCalibrationCount changed');
          }
          // generating a prompt number
          let promptNum = Math.floor(Math.random() * 100);
          // checking if not more than two even or two odd in a row.
          if (this.analytics && this.analytics.length >= 2) {
            const prevReps = this.analytics.slice(-2);
            if (prevReps[0].prompt.type === prevReps[1].prompt.type) {
              // if two even or two odd in a row, we generate the opposite class number.
              prevReps[0].prompt.type === 'sit'
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
            },
            attributes: {
              visibility: 'visible',
              reCalibrationCount,
            },
          };
          const promptTimestamp = Date.now();
          const res = await this.sit2StandService.waitForClassChangeOrTimeOut(
            promptClass,
            this.config.speed,
          );
          const reactionTimestamp = Date.now();
          this.totalReps += 1;
          this.elements.timeout.state = {
            data: {
              mode: 'stop',
            },
            attributes: {
              visibility: 'hidden',
              reCalibrationCount,
            },
          };
          if (res.result === 'success') {
            this.soundsService.playMusic(this.genre, 'trigger');
            this.analytics.push({
              prompt: {
                type: promptClass,
                timestamp: promptTimestamp,
                data: {
                  number: promptNum,
                },
              },
              reaction: {
                type: promptClass,
                timestamp: reactionTimestamp,
                startTime: Date.now(),
                completionTime: Date.now(),
              },
              result: {
                type: 'success',
                timestamp: Date.now(),
                score: 1,
              },
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
            this.successfulReps += 1;
            this.failedReps = 0;
            this.store.dispatch(game.repCompleted());
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
          } else {
            this.soundsService.playCalibrationSound('error');
            this.analytics.push({
              prompt: {
                type: promptClass,
                timestamp: promptTimestamp,
                data: {
                  number: promptNum,
                },
              },
              reaction: {
                type: promptClass === 'sit' ? 'stand' : 'sit',
                timestamp: reactionTimestamp,
                startTime: Date.now(),
                completionTime: Date.now(),
              },
              result: {
                type: 'failure',
                timestamp: Date.now(),
                score: 0,
              },
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
            this.failedReps += 1;
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
                          <img style='width:250px;height:250px;' src='assets/images/overlay_icons/Standing Man.png'/>
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
                              <img style='width:250px;height:250px;' src='assets/images/overlay_icons/Sitting on Chair.png'/>
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

  postLoop() {
    console.log('running Sit,Stand,Achieve postLoop');
    return [
      async (reCalibrationCount: number) => {
        this.gameStateService.postLoopHook();
        this.soundsService.stopGenreSound();

        const achievementRatio = this.successfulReps / this.totalReps;
        if (achievementRatio < 0.6) {
          await this.checkinService.updateOnboardingStatus({
            sit_stand_achieve: false,
          });
        }

        let totalDuration: {
          minutes: string;
          seconds: string;
        };
        this.store.pipe(take(1)).subscribe(async (state) => {
          totalDuration = this.sit2StandService.updateTimer(state.game.totalDuration || 0);
          const fastestTimeInSecs = await this.checkinService.getFastestTime('sit_stand_achieve');
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
