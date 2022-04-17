import { Results } from '@mediapipe/holistic';
import { createReducer, on } from '@ngrx/store';
import { pose } from '../../actions/pose.actions';

export const initialState: Results | undefined = undefined;

const handleSend = (state: any, data:any) => {
  return data
}

const _poseReducer = createReducer(
  initialState,
  on(pose.send, handleSend),
);

export function poseReducer(state:any, action:any) {
  return _poseReducer(state, action)
}
