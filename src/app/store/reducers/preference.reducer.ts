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
    const newState = Object.assign({}, state);
    newState.genre = data.genre;
    return newState;
  }),
  on(preference.updateMood, (state, data) => {
    const newState = Object.assign({}, state);
    newState.mood = data.mood;
    return newState;
  }),
);

export function preferenceReducer(state: any, action: any) {
  return _preferenceReducer(state, action);
}
