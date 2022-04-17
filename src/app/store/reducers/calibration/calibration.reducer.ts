import { createReducer, on } from '@ngrx/store';
import { calibration } from 'src/app/store/actions/calibration.actions'
import { CalibrationState } from 'src/app/types/pointmotion';
// import { Calibration, CalibrationDetails, CalibrationStatusType } from 'src/app/types/calibration-status';

export const initialState: CalibrationState = {
  status: 'error',
  reason: '',
  poseHash: 0
};

function sit2standPoseHashGenerator(state: CalibrationState, data: {pose: any, reason: string}) {
  // @ts-ignore
  // return state.pose?.poseLandmarks[12].x - data.pose?.poseLandmarks[12].x
  // ^ build a better logic with some threshold or something...
  return 0
}

const _calibrationReducer = createReducer(
  initialState,
  on(calibration.success, (state, data) => {
    return {
      status: 'success', 
      reason: data.reason,
      pose: data.pose,
      poseHash: sit2standPoseHashGenerator(state, data)
    }
  }),
  // TODO
  on(calibration.warning, (state, data) => {
    console.log('calibration warning');
    
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