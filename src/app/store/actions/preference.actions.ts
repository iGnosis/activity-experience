import { createAction, props } from '@ngrx/store';
import { PreferenceState } from 'src/app/types/pointmotion';

export const preference = {
  updateGenre: createAction('[Preference] Update Genre', props<PreferenceState>()),
  updateMood: createAction('[Preference] Update Mood', props<PreferenceState>()),
};
