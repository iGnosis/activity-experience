import { createAction, props } from '@ngrx/store';
import { Genre, PreferenceState } from 'src/app/types/pointmotion';

export const preference = {
  updateGenre: createAction('[Preference] Update Genre', props<{ genre: Genre }>()),
  updateMood: createAction('[Preference] Update Mood', props<{ mood: string }>()),
};
