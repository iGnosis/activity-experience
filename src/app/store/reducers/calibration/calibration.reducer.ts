import { createReducer, on } from '@ngrx/store';
import { SitToStandService } from 'src/app/services/classifiers/sit-to-stand/sit-to-stand.service';
import { calibration } from 'src/app/store/actions/calibration.actions'
import { CalibrationState } from 'src/app/types/pointmotion';
// import { Calibration, CalibrationDetails, CalibrationStatusType } from 'src/app/types/calibration-status';

export const initialState: CalibrationState = {
  status: 'error',
  reason: '',
  poseHash: 0
};

function sit2standPoseHashGenerator(state: CalibrationState, data: { pose: any, reason: string }) {
  // initial calibration state.
  // do nothing.
  if (state.status === 'error') return -1

  // work out old distances
  const oldPoseLandmarkArray = state.pose?.poseLandmarks!;
  const oldLeftHip = oldPoseLandmarkArray[23];
  const oldLeftKnee = oldPoseLandmarkArray[25];
  const oldRightHip = oldPoseLandmarkArray[24];
  const oldRightKnee = oldPoseLandmarkArray[26];

  const oldDistLeftHipKnee = SitToStandService.calcDist(
    oldLeftHip.x,
    oldLeftHip.y,
    oldLeftKnee.x,
    oldLeftKnee.y
  )
  const oldDistRightHipKnee = SitToStandService.calcDist(
    oldRightHip.x,
    oldRightHip.y,
    oldRightKnee.x,
    oldRightKnee.y
  )
  const oldDistAvg = (oldDistLeftHipKnee + oldDistRightHipKnee) / 2

  // work out new distances
  const newPostLandmarkArray = data.pose?.poseLandmarks!;
  const newLeftHip = newPostLandmarkArray[23];
  const newLeftKnee = newPostLandmarkArray[25];
  const newRightHip = newPostLandmarkArray[24];
  const newRightKnee = newPostLandmarkArray[26];

  const newDistLeftHipKnee = SitToStandService.calcDist(
    newLeftHip.x,
    newLeftHip.y,
    newLeftKnee.x,
    newLeftKnee.y
  )
  const newDistRightHipKnee = SitToStandService.calcDist(
    newRightHip.x,
    newRightHip.y,
    newRightKnee.x,
    newRightKnee.y
  )
  const newDistAvg = (newDistLeftHipKnee + newDistRightHipKnee) / 2

  // figuring out a relationship between those two...
  console.log('oldDistAvg:', oldDistAvg)
  console.log('newDistAvg:', newDistAvg)
  console.log('oldDistance / newDistance =', oldDistAvg / newDistAvg)

  const result = oldDistAvg / newDistAvg
  // When task is to 'Stand' from initial position 'Sit' - threshold approaches < 1
  // Need to check for the task type in this 'if' condition
  if (result < 0.8) {
    console.log('send reactionTime event for Stand task')
  }
  // When task is to 'Sit' from initial position 'Stand' - threshold approaches > 1
  // Need to check for the task type in this 'if' condition
  else if (result > 1.2) {
    console.log('send reactionTime event for Sit task')
  }
  // When initial position and desired position stays the same. Threshold stays about 1.
  // Need to check for the task type in this 'if' condition
  else if (result > 0.9 && result < 1.1) {
    console.log('send reactionTime event for (Sit | Stand) task')
  }
  return 1
}

const _calibrationReducer = createReducer(
  initialState,
  on(calibration.success, (state, data) => {
    // console.log(sit2standPoseHashGenerator(state, data))
    return {
      status: 'success',
      reason: data.reason,
      pose: data.pose,
      poseHash: sit2standPoseHashGenerator(state, data)
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

export function calibrationReducer(state: any, action: any) {
  return _calibrationReducer(state, action);
}