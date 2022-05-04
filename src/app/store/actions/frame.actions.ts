import { createAction, props } from '@ngrx/store';

export const frame = {
  send: createAction('[Frame] Send', props<{ frame: any }>()),
};
