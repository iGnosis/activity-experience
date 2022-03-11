import { createReducer, on } from '@ngrx/store';
import { calibration } from 'src/app/store/actions/calibration.actions'
// import { Calibration, CalibrationDetails, CalibrationStatusType } from 'src/app/types/calibration-status';

export const initialState: any = {
  status: 'error',
  details: '0'
};

const _calibrationReducer = createReducer(
  initialState,
  on(calibration.success, (state, details) => { 
    return {
      status: 'success', 
      details
    }
  }),
  // TODO
  on(calibration.warning, (state, details) => {
    return {
      status: 'warning', 
      details
    }
  }),
  on(calibration.error, (state, details) => {
    return {
      status: 'error', 
      details
    }
  }),
);

export function calibrationReducer(state:any, action:any) {
  return _calibrationReducer(state, action);
}