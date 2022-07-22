import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import { ActivityBase } from 'src/app/types/pointmotion';
import { ElementsService } from '../../elements/elements.service';
import { GameStateService } from '../../game-state/game-state.service';

@Injectable({
  providedIn: 'root',
})
export class SitToStandService implements ActivityBase {
  constructor(
    private store: Store,
    private elements: ElementsService,
    private gameStateService: GameStateService,
  ) {
    this.store
      .select((state: any) => state.game)
      .subscribe((game) => {
        if (game.id) {
          //Update the game state whenever redux state changes
          this.gameStateService.updateGame(game.id, game);
        }
      });
    // Register this service with with something...
  }

  welcome() {
    console.log('running welcome');
    return [
      async () => {
        this.elements.ribbon.state = {
          attributes: {
            visibility: 'visible',
          },
          data: {
            titles: ['Next Activity', 'Sit, Stand, Achieve'],
            transitionDuration: 1000,
          },
        };
        await this.elements.sleep(6000);
      },
      async () => {
        this.elements.overlay.state = {
          attributes: {
            visibility: 'visible',
          },
          data: {
            ...this.elements.overlay.state.data,
            transitionDuration: 2000,
          },
        };
        await this.elements.sleep(8000);
      },
      async () => {
        this.elements.banner.state = {
          attributes: {
            visibility: 'visible',
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
    ];
  }

  tutorial() {
    console.log('running tutorial');
    return [
      async () => {
        this.elements.ribbon.state = {
          data: {
            titles: ['Tutorial', 'Starting Now'],
            transitionDuration: 1000,
          },
          attributes: {
            visibility: 'visible',
          },
        };
        await this.elements.sleep(4000);
        this.elements.score.state = {
          attributes: {
            visibility: 'visible',
          },
          data: {
            label: 'Score',
            value: '0',
          },
        };
      },
      async () => {
        await this.elements.sleep(8000);
        this.elements.ribbon.state = {
          data: {
            titles: ['Tut, tut.', '1', '2', '3'],
            transitionDuration: 1000,
          },
          attributes: {
            visibility: 'visible',
          },
        };
        await this.elements.sleep(4000);
        this.elements.score.state = {
          attributes: {
            visibility: 'visible',
          },
          data: {
            label: 'Score',
            value: '100',
          },
        };
      },
      async () => {
        this.elements.banner.state = {
          data: {
            htmlStr: `
            <h2 class="text-primary p-5">When consecutive even or odd numbers appear.</h2>
            <h3 class="text-primary p-5">Continue sitting or standing until the timer below runs out.</h3>
            `,
            buttons: [
              {
                title: 'Starts in 3 seconds',
                progressDurationMs: 3000,
              },
            ],
          },
          attributes: {
            visibility: 'visible',
          },
        };
        await this.elements.sleep(5000);

        const promptNums = [15, 20, 16];
        for (let i = 0; i < promptNums.length; i++) {
          this.elements.prompt.state = {
            data: {
              value: promptNums[i],
            },
            attributes: {
              visibility: 'visible',
            },
          };
          this.elements.timeout.state = {
            data: {
              mode: 'start',
              timeout: 2000,
            },
            attributes: {
              visibility: 'visible',
            },
          };
          await this.elements.sleep(2500);
        }
        this.elements.prompt.attributes = {
          visibility: 'hidden',
        };
        this.elements.guide.state = {
          data: {
            title: "Great job, looks like you're getting the hang of it.",
            titleDuration: 2000,
          },
          attributes: {
            visibility: 'visible',
          },
        };
        await this.elements.sleep(2000);
      },
      async () => {
        this.elements.score.state = {
          data: {
            label: 'Reps',
            value: 0,
          },
          attributes: {
            visibility: 'visible',
          },
        };
        this.elements.ribbon.state = {
          data: {
            titles: ["Let's get 5 correct repetitions", '3', '2', '1', 'Go!'],
            transitionDuration: 800,
          },
          attributes: {
            visibility: 'visible',
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
            },
          };
          this.elements.timeout.state = {
            data: {
              mode: 'start',
              timeout: 2000,
            },
            attributes: {
              visibility: 'visible',
            },
          };
          await this.elements.sleep(2500);
        }
        this.elements.score.attributes = {
          visibility: 'hidden',
        };
        this.elements.prompt.attributes = {
          visibility: 'hidden',
        };
        this.elements.ribbon.state = {
          data: {
            titles: ['Guide completed'],
            transitionDuration: 800,
          },
          attributes: {
            visibility: 'visible',
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
      async () => {
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
