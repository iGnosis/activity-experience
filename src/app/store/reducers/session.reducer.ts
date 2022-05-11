import { createReducer, on } from '@ngrx/store';
import { SessionState } from 'src/app/types/pointmotion';
import { session } from '../actions/session.actions';

function saveToLocalStorage(session: any) {
  console.log('session', JSON.stringify(session));
  localStorage.setItem('session', JSON.stringify(session));
}

function getFromLocalStorage() {
  return JSON.parse(localStorage.getItem('session') || '{}') || {};
}

const initialState: SessionState = getFromLocalStorage();

const _sessionReducer = createReducer(
  initialState,

  on(session.updateConfig, (state, data) => {
    console.log(data);
    const newState = Object.assign({}, state);
    newState.session = Object.assign({}, data);
    saveToLocalStorage(newState);
    console.log(newState);
    return newState;
  }),
  on(session.setPreSessionMood, (state, data) => {
    const newState = Object.assign({}, state);
    newState.session ? (newState.session.preSessionMood = data.mood) : null;
    saveToLocalStorage(newState);
    return newState;
  }),
  on(session.setPostSessionMood, (state, data) => {
    const newState = Object.assign({}, state);
    newState.session ? (newState.session.postSessionMood = data.mood) : null;
    saveToLocalStorage(newState);
    return newState;
  }),
  on(session.startSession, (state, data) => {
    const newState = Object.assign({}, state);
    saveToLocalStorage(newState);
    return newState;
  }),
  on(session.startActivity, (state, data) => {
    const newState = Object.assign({}, state);
    newState.currentActivity = data;
    saveToLocalStorage(newState);
    return newState;
  }),
  on(session.addRep, (state, data) => {
    if (state.currentActivity) {
      const newState = {
        ...state,
        currentActivity: {
          ...state.currentActivity,
          repsCompleted: state.currentActivity!.repsCompleted + 1 || 0,
        },
      };
      return newState;
    }
    return state;
  }),
);

export function sessionReducer(state: any, action: any) {
  return _sessionReducer(state, action);
}
