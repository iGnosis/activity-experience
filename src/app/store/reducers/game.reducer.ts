import { createReducer, on } from '@ngrx/store';
import { GameState } from 'src/app/types/pointmotion';
import { game } from '../actions/game.actions';

/**
 * {
 *  id: '',
 *  createdAt: '',
 *  updatedAt: '',
 *  endedAt: '',
 *  game: "sit_stand_achieve" | "beat_boxer" | "sound_slicer",
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
      id: data.id,
    };
  }),
  on(game.updateGame, (state, data) => {
    return {
      ...state,
      ...data,
    };
  }),
  on(game.repCompleted, (state) => {
    return {
      ...state,
      repsCompleted: (state.repsCompleted || 0) + 1,
    };
  }),
  on(game.pushAnalytics, (state, data) => {
    return {
      ...state,
      analytics: data.analytics,
    };
  }),
  on(game.setTotalElapsedTime, (state, data) => {
    return {
      ...state,
      totalDuration: data.totalDuration,
    };
  }),
  on(game.gameCompleted, (state) => {
    return {
      ...state,
      endedAt: 'now()',
    };
  }),
);

export function gameReducer(state: any, action: any) {
  return _gameReducer(state, action);
}
