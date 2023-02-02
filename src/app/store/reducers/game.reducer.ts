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
      id: data.id,
    };
  }),
  on(game.setScore, (state, data) => {
    return {
      id: state.id,
      repsCompleted: data.score,
    };
  }),
  on(game.repCompleted, (state, data) => {
    return {
      id: state.id,
      repsCompleted: data.repsCompleted,
    };
  }),
  on(game.pushAnalytics, (state, data) => {
    return {
      id: state.id,
      analytics: data.analytics,
    };
  }),
  on(game.setCalibrationDuration, (state, data) => {
    return {
      id: state.id,
      calibrationDuration: (state.calibrationDuration || 0) + (data.calibrationDuration || 0),
    };
  }),
  on(game.setTotalElapsedTime, (state, data) => {
    return {
      id: state.id,
      totalDuration: data.totalDuration,
    };
  }),
  on(game.gameCompleted, (state) => {
    return {
      id: state.id,
      endedAt: new Date().toISOString(),
    };
  }),
  on(game.saveGameSettings, (state, data) => {
    return {
      id: state.id,
      settings: data.settings,
    };
  }),
);

export function gameReducer(state: any, action: any) {
  return _gameReducer(state, action);
}
