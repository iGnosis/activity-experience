import { createReducer, on } from '@ngrx/store';
import { GameState } from 'src/app/types/pointmotion';
import { game } from '../actions/game.actions';

/**
 * {
 *  id: '',
 *  createdAt: '',
 *  updatedAt: '',
 *  status: '',
 *  game: ["sit.stand.achieve", "beat.boxer", "sound.slicer"],
 *  repsCompleted: 5,
 *  totalDuration: 1000,
 *  analytics: [{prompt: 12, class: '', success: true, score: 10, reactionTime: 1000}]
 * }
 */

const initialState: GameState = {};

const _gameReducer = createReducer(
  initialState,
  on(game.newGame, (state, data) => {
    return {
      ...state,
      ...data,
    };
  }),
  on(game.updateGame, (state, data) => {
    return {
      ...state,
      ...data,
    };
  }),
);

export function gameReducer(state: any, action: any) {
  return _gameReducer(state, action);
}
