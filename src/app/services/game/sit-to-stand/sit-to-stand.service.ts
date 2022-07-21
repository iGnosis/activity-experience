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
    return [
      async () => {
        this.elements.ribbon.state = {
          data: {
            titles: ['Sit To Stand', 'Starting Now'],
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
            titles: ['Ok, starting now.', '1', '2', '3'],
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
    ];
  }

  tutorial() {
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

  preLoop() {
    return [];
  }

  postLoop() {
    return [];
  }
}
