import { createReducer, on } from '@ngrx/store';
import { calibration } from 'src/app/store/actions/calibration.actions'
import { CalibrationState } from 'src/app/types/pointmotion';
// import { Calibration, CalibrationDetails, CalibrationStatusType } from 'src/app/types/calibration-status';

export const initialState: CalibrationState = {
  status: 'error',
  reason: ''
};

const _calibrationReducer = createReducer(
  initialState,
  on(calibration.success, (state, data) => { 
    return {
      status: 'success', 
      reason: data.reason
    }
  }),
  // TODO
  on(calibration.warning, (state, data) => {
    return {
      status: 'warning', 
      reason: data.reason
    }
  }),
  on(calibration.error, (state, data) => {
    return {
      status: 'error', 
      reason: data.reason
    }
  }),
);

export function calibrationReducer(state: any, action:any) {
  return _calibrationReducer(state, action);
}