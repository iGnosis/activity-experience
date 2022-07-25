import { createReducer, on } from '@ngrx/store';
import { PreferenceState } from 'src/app/types/pointmotion';
import { preference } from '../actions/preference.actions';

/**
 * {
 *  genre: '',
 *  mood: '',
 * }
 */

const initialState: PreferenceState = {};

const _preferenceReducer = createReducer(
  initialState,
  on(preference.updateGenre, (state, data) => {
    return {
      ...state,
      ...data,
    };
  }),
  on(preference.updateMood, (state, data) => {
    return {
      ...state,
      ...data,
    };
  }),
);

export function preferenceReducer(state: any, action: any) {
  return _preferenceReducer(state, action);
}
