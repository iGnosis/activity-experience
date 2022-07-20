import { createAction, props } from '@ngrx/store';
import { GameState } from 'src/app/types/pointmotion';

export const game = {
  test: createAction('[Game] Test', props<GameState>()),
};
