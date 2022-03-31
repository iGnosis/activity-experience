import { createReducer, on } from '@ngrx/store';
import { frame } from '../../actions/frame.actions';

export const initialState: string = '';

const handleSend = (state: any, data:any) => {
  return data
}

const _frameReducer = createReducer(
  initialState,
  on(frame.send, handleSend),
);

export function frameReducer(state:any, action:any) {
  return _frameReducer(state, action)
}
