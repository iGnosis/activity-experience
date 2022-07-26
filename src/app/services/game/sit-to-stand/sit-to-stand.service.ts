import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import { debounceTime } from 'rxjs';
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
import { preference } from 'src/app/store/actions/preference.actions';
import { SoundsService } from '../../sounds/sounds.service';
import { environment } from 'src/environments/environment';
import { game } from 'src/app/store/actions/game.actions';
import { TtsService } from '../../tts/tts.service';
@Injectable({
  providedIn: 'root',
})
export class SitToStandService implements ActivityBase {
  _handTrackerStatus: HandTrackerStatus;
  private genre: Genre;
  private successfulReps = 0;
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
  ) {
    this.store
      .select((state) => state.game)
      .subscribe((game) => {
        if (game.id) {
          //Update the game state whenever redux state changes
          const { id, ...gameState } = game;
          this.gameStateService.updateGame(id, gameState);
        }
      });

    this.store
      .select((state) => state.preference)
      .subscribe((preference) => {
        this.genre = preference.genre || 'jazz';
        this.soundsService.loadMusicFiles(this.genre);
      });

    this.handTrackerService.enable();
    this.handTrackerService.result
      .pipe(debounceTime(1500))
      .subscribe((status: HandTrackerStatus) => {
        this._handTrackerStatus = status;
        console.log('SitToStandService:_handTrackerStatus:', this._handTrackerStatus);
      });

    this.sit2StandService.enable();
    // Register this service with with something...
  }

  welcome() {
    console.log('running welcome');
    this.soundsService.playActivityInstructionSound();
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
            transitionDuration: 2000,
          },
        };
        await this.elements.sleep(8000);
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
      },
    ];
  }

  tutorial() {
    console.log('running tutorial');
    return [
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

        this.elements.guide.state = {
          data: {},
          attributes: {
            visibility: 'hidden',
            reCalibrationCount,
          },
        };

        this.elements.banner.state = {
          data: {},
          attributes: {
            visibility: 'hidden',
            reCalibrationCount,
          },
        };

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
        this.elements.guide.state = {
          data: {},
          attributes: {
            visibility: 'hidden',
            reCalibrationCount,
          },
        };

        this.elements.banner.state = {
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
          this.elements.prompt.state.data.value = res.result === 'failure' ? '✕' : '✓';
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
        this.elements.banner.state = {
          data: {
            htmlStr: `
              <div class="w-full h-100 position-absolute translate-middle top-1/2 start-1/2 rounded-4 d-flex align-items-center flex-column justify-content-center bg-info ">
                <div class='p-10 d-flex flex-row align-items-center justify-content-between w-full'>
                      <img style='width:150px;height:150px;' src='assets/images/overlay_icons/Sitting on Chair.png'/>
                      <div class='bg-success p-6 display-6 text-white rounded-3 mx-4'>42</div>
                </div>
                <p class="display-6 text-white text-start px-10">When consecutive even or odd numbers appear.</p>
                <div class="p-10 w-full">
                  <hr style="border: 2px solid #A0AEC0;">
                  <p class="h1 text-start text-white">Continue sitting or<br/>standing until the timer<br/>below runs out.</p>
                </div>
              </div>
        `,
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
        this.elements.banner.state = {
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
          this.elements.prompt.state.data.value = res.result === 'failure' ? '✕' : '✓';
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

        const promptNums = Array.from({ length: 5 }, () => Math.floor(Math.random() * 100));

        for (let i = 0; i < promptNums.length; i++) {
          this.elements.prompt.state = {
            data: {
              value: promptNums[i],
            },
            attributes: {
              visibility: 'visible',
              reCalibrationCount,
            },
          };
          this.ttsService.tts(promptNums[i].toString());
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
            promptNums[i] % 2 === 0 ? 'sit' : 'stand',
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
          this.elements.prompt.state.data.value = res.result === 'failure' ? '✕' : '✓';
          if (res.result === 'failure') --i;
          await this.elements.sleep(1000);
        }
        this.elements.prompt.attributes = {
          visibility: 'hidden',
          reCalibrationCount,
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
        await this.elements.sleep(3400);

        this.soundsService.pauseActivityInstructionSound();
      },
    ];
  }

  preLoop() {
    return [];
  }

  loop() {
    return [
      async (reCalibrationCount: number) => {
        this.soundsService.playMusic(this.genre, 'backtrack');
        this.elements.score.state = {
          data: {
            label: 'Reps',
            value: 0,
          },
          attributes: {
            visibility: 'visible',
            reCalibrationCount,
          },
        };
        this.elements.timer.state = {
          data: {
            mode: 'start',
            duration: 60 * 60 * 1000,
            onComplete: (elapsedTime) => {
              // TODO: use this elapsedTime for postLoop metrics..
              console.log('totalElapsedTime: ', elapsedTime);
            },
          },
          attributes: {
            visibility: 'visible',
            reCalibrationCount,
          },
        };
      },
      async (reCalibrationCount: number) => {
        while (this.successfulReps < this.config.minCorrectReps) {
          // generating a prompt number
          let promptNum = Math.floor(Math.random() * 100);
          // checking if not more than two even or two odd in a row.
          if (this.analytics && this.analytics.length >= 2) {
            const prevReps = this.analytics.slice(-2);
            if (prevReps[0].class === prevReps[1].class) {
              // if two even or two odd in a row, we generate the opposite class number.
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
          if (res.result === 'success') {
            this.soundsService.playMusic(this.genre, 'trigger');
            this.analytics.push({
              prompt: promptNum,
              class: promptClass,
              score: 0,
              success: true,
              reactionTime: 0,
            });
            this.elements.prompt.state.data.value = '✓';
            this.successfulReps += 1;
            this.store.dispatch(game.repCompleted());
            this.elements.score.state = {
              data: {
                label: 'Reps',
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
              prompt: promptNum,
              class: promptClass,
              score: 0,
              success: false,
              reactionTime: 0,
            });
            this.elements.prompt.state.data.value = '✕';
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
    console.log('running postLoop');
    return [
      async (reCalibrationCount: number) => {
        this.soundsService.stopGenreSound();
        this.elements.banner.show();
        this.elements.banner.data = {
          type: 'outro',
          htmlStr: `
          <div class="pl-10 text-start px-14" style="padding-left: 20px;">
            <h1 class="pt-8 display-3">Sit, Stand, Achieve</h1>
            <h2 class="pt-7">Time: 1:17 minutes</h2>
            <h2 class="pt-5">Fastest Time: 0:31 minutes</h2>
            <h2 class="py-5">Reps Completed: 10</h2>
          <div>
          `,
          buttons: [
            {
              title: 'Next Activity',
            },
          ],
        };
        await this.elements.sleep(6000);
      },
    ];
  }
}
