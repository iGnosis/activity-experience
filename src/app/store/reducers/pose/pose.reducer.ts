import { Results } from '@mediapipe/holistic';
import { createReducer, on } from '@ngrx/store';
import { pose } from '../../actions/pose.actions';

// @ts-ignore
export const initialState: Results = undefined;

const handleSend = (state: any, data:any) => {
  // console.log(data)
  return data
}

const _poseReducer = createReducer(
  initialState,
  on(pose.send, handleSend),
);

export function poseReducer(state:any, action:any) {
  return _poseReducer(state, action)
}
