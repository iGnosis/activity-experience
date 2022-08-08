import { createAction, props } from '@ngrx/store';

// export const testStringAction = createAction('test str action', props<String>())
export const testStringAction = createAction(
  'test obj action',
  props<{ name: string; age: number }>(),
);
