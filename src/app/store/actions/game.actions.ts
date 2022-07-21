import { createAction, props } from '@ngrx/store';
import { GameState } from 'src/app/types/pointmotion';

export const game = {
  newGame: createAction('[Game] New Game', props<GameState>()),
  updateGame: createAction('[Game] Update Game', props<GameState>()),
};
