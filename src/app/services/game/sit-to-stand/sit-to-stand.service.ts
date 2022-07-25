import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import { debounceTime } from 'rxjs';
import {
  ActivityBase,
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
@Injectable({
  providedIn: 'root',
})
export class SitToStandService implements ActivityBase {
  _handTrackerStatus: HandTrackerStatus;
  private genre: Genre;

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
  ) {
    this.store
      .select((state) => state.game)
      .subscribe((game) => {
        if (game.id) {
          //Update the game state whenever redux state changes
          this.gameStateService.updateGame(game.id, game);
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
    return [
      async (reCalibrationCount: number) => {
        this.elements.ribbon.state = {
          attributes: {
            visibility: 'visible',
            reCalibrationCount,
          },
          data: {
            titles: ['Next Activity', 'Sit, Stand, Achieve'],
            transitionDuration: 1000,
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
            <h2 class="pt-2">First Activity</h2>
            <h1 class="pt-3 display-5">Sit, Stand, Achieve</h1>
            <h2 class="pt-6" style="font-weight: 200">Area of Focus</h2>
            <h2 class="pt-2">Balance and Reaction Time</h2>
            `,
            buttons: [
              {
                title: 'Starting Sit, Stand, Achieve',
                progressDurationMs: 5000,
              },
            ],
          },
        };
        await this.elements.sleep(7000);
      },
      async (reCalibrationCount: number) => {
        this.elements.guide.state = {
          data: {
            title: 'Please raise your left hand to get started.',
            titleDuration: 10000,
          },
          attributes: {
            visibility: 'visible',
            reCalibrationCount,
          },
        };

        // maybe there's a better way...
        const waitUntilHandRaised = async () => {
          return new Promise((resolve, _) => {
            const interval = setInterval(() => {
              if (this._handTrackerStatus === 'left-hand') {
                clearInterval(interval);
                resolve({});
              }
            }, 300);
          });
        };
        await waitUntilHandRaised();
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
        await this.elements.sleep(3000);

        this.elements.banner.state = {
          data: {
            htmlStr: `
              <div class="w-full h-full position-absolute translate-middle top-1/2 start-1/2 rounded-4 d-flex align-items-center flex-column justify-content-center bg-info ">
                <div class='p-4 d-flex flex-row align-items-center'>
                      <img style='width:150px;height:150px;' src='assets/images/overlay_icons/Standing Man.png'/>
                      <div class='bg-success p-6 display-6 text-white rounded-3 mx-4'>1</div>
                      <div class='bg-success p-6 display-6 text-white rounded-3 mx-4'>17</div>
                      <div class='bg-success p-6 display-6 text-white rounded-3 mx-4'>23</div>
                </div>
                <div>
                  <hr style="border: 2px solid #A0AEC0;">
                  <p class=" display-6 text-white">Odd Number - Stand Up</p>
                </div>
              </div>
        `,
          },
          attributes: {
            visibility: 'visible',
            reCalibrationCount,
          },
        };

        await this.elements.sleep(3000);

        this.elements.banner.state = {
          data: {},
          attributes: {
            visibility: 'hidden',
            reCalibrationCount,
          },
        };

        await this.elements.sleep(500);

        this.elements.banner.state = {
          data: {
            htmlStr: `
                <div class="w-full h-full position-absolute translate-middle top-1/2 start-1/2 rounded-4 d-flex align-items-center flex-column justify-content-center bg-info ">
                  <div class='p-4 d-flex flex-row align-items-center'>
                        <img style='width:150px;height:150px;' src='assets/images/overlay_icons/Sitting on Chair.png'/>
                        <div class='bg-success p-6 display-6 text-white rounded-3 mx-4'>2</div>
                        <div class='bg-success p-6 display-6 text-white rounded-3 mx-4'>14</div>
                        <div class='bg-success p-6 display-6 text-white rounded-3 mx-4'>38</div>
                  </div>
                  <div>
                    <hr style="border: 2px solid #A0AEC0;">
                    <p class=" display-6 text-white">Even Number - Sit Down</p>
                  </div>
                </div>

            `,
          },
          attributes: {
            visibility: 'visible',
            reCalibrationCount,
          },
        };

        await this.elements.sleep(3000);
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
          this.elements.timeout.state = {
            data: {
              mode: 'start',
              timeout: 5000,
            },
            attributes: {
              visibility: 'visible',
              reCalibrationCount,
            },
          };
          const res = await this.sit2StandService.waitForClassChangeOrTimeOut(
            parseInt(promptNums[i]) % 2 === 0 ? 'sit' : 'stand',
          );
          this.elements.prompt.state.data.value = res.result === 'failure' ? '✕' : '✓';
          if (res.result === 'failure') --i; //repeat current prompt if failure
          await this.elements.sleep(6000);
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
                <div class='p-4 d-flex flex-row align-items-center justify-content-between w-full p-5'>
                      <img style='width:150px;height:150px;' src='assets/images/overlay_icons/Sitting on Chair.png'/>
                      <div class='bg-success p-6 display-6 text-white rounded-3 mx-4'>42</div>
                </div>
                <p class="display-6 text-white text-start px-5">When consecutive even or odd numbers appear.</p>
                <div class="p-5 w-full">
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
        await this.elements.sleep(3000);
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
          this.elements.timeout.state = {
            data: {
              mode: 'start',
              timeout: 2000,
            },
            attributes: {
              visibility: 'visible',
              reCalibrationCount,
            },
          };
          const res = await this.sit2StandService.waitForClassChangeOrTimeOut(
            parseInt(promptNums[i]) % 2 === 0 ? 'sit' : 'stand',
          );
          this.elements.prompt.state.data.value = res.result === 'failure' ? '✕' : '✓';
          if (res.result === 'failure') --i;
          await this.elements.sleep(6000);
        }
        this.elements.prompt.attributes = {
          visibility: 'hidden',
          reCalibrationCount,
        };
        this.elements.guide.state = {
          data: {
            title: "Great job, looks like you're getting the hang of it.",
            titleDuration: 2000,
          },
          attributes: {
            visibility: 'visible',
            reCalibrationCount,
          },
        };
        await this.elements.sleep(2000);
      },
      async (reCalibrationCount: number) => {
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
        this.elements.ribbon.state = {
          data: {
            titles: ["Let's get 5 correct repetitions", '3', '2', '1', 'Go!'],
            transitionDuration: 800,
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
          this.elements.timeout.state = {
            data: {
              mode: 'start',
              timeout: 2000,
            },
            attributes: {
              visibility: 'visible',
              reCalibrationCount,
            },
          };
          const res = await this.sit2StandService.waitForClassChangeOrTimeOut(
            promptNums[i] % 2 === 0 ? 'sit' : 'stand',
          );
          this.elements.prompt.state.data.value = res.result === 'failure' ? '✕' : '✓';
          if (res.result === 'failure') --i;
          await this.elements.sleep(6000);
        }
        this.elements.score.attributes = {
          visibility: 'hidden',
          reCalibrationCount,
        };
        this.elements.prompt.attributes = {
          visibility: 'hidden',
          reCalibrationCount,
        };
        this.elements.ribbon.state = {
          data: {
            titles: ['Guide completed'],
            transitionDuration: 800,
          },
          attributes: {
            visibility: 'visible',
            reCalibrationCount,
          },
        };
        await this.elements.sleep(3400);
      },
    ];
  }

  preLoop() {
    return [];
  }

  loop() {
    return [
      // async () => {
      //   // TODO... add code to update the game state
      //   this.fun('hi my name is mila');
      //   this.fun('I am thrilled to be working with you');
      //   await this.fun('let me tell you how it works');
      //   this.elements.banner.data = {
      //     value: '0',
      //   };
      // },
      // async () => {
      //   this.fun('When you see an odd number, stand');
      //   this.fun('When you see an even number, sit');
      // },
      // () => {},
    ];
  }

  postLoop() {
    console.log('running postLoop');
    return [
      async (reCalibrationCount: number) => {
        this.elements.banner.show();
        this.elements.banner.data = {
          type: 'outro',
          htmlStr: `
          <div class="pl-2" style="padding-left: 20px;">
            <h1 class="pt-3 display-4">Sit, Stand, Achieve</h1>
            <h2 class="pt-2">Time: 1:17 minutes</h2>
            <h2 class="pt-2">Fastest Time: 0:31 minutes</h2>
            <h2 class="pt-2">Reps Completed: 10</h2>
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
