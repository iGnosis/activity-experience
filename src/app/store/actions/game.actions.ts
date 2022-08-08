import { createAction, props } from '@ngrx/store';
import { GameState } from 'src/app/types/pointmotion';

export const game = {
  newGame: createAction('[Game] New Game', props<GameState>()),
  updateGame: createAction('[Game] Update Game', props<GameState>()),
  pushAnalytics: createAction('[Game] Pushes analytics to server', props<GameState>()),
  repCompleted: createAction('[Game] Rep Completed'),
  setTotalElapsedTime: createAction('[Game] Set Total Duration', props<GameState>()),
  gameCompleted: createAction('[Game] Game Completed'),
};
