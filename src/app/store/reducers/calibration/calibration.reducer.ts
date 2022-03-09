import { createReducer, on } from '@ngrx/store';
import { calibration } from 'src/app/store/actions/calibration.actions'

export const initialState = 'unknown';

const _calibrationReducer = createReducer(
  initialState,
  on(calibration.invalid, (state) => 'invalid'),
  on(calibration.multiplePeopleDetected, (state) => 'multiplePeopleDetected'),
  on(calibration.noPersonDetected, (state) => 'noPersonDetected'),
  on(calibration.outOfBound, (state) => 'outOfBound')
);

export function calibrationReducer(state:any, action:any) {
  return _calibrationReducer(state, action);
}