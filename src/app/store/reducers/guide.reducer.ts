import { createReducer, on } from '@ngrx/store';
import {
  GuideActionShowMessageDTO,
  GuideState,
} from 'src/app/types/pointmotion';
import { guide } from '../actions/guide.actions';

/**
 * {
 *      avatar: '',
 *      visibility: maximized, minimized, hidden,
 *      title: '',
 *      text: '', //support html?
 *      prompt: '',
 *      entryAnimation: '',
 *      exitAnimation: ''
 * }
 */
const initialState: GuideState = {};

const _guideReducer = createReducer(
  initialState,

  on(guide.hide, (state, data) => {
    return {};
  }),

  on(guide.updateAvatar, (state, data) => {
    const newState = Object.assign({}, state);
    newState.avatar = data;
    return newState;
  }),

  on(guide.sendMessage, (state, data) => {
    const newState = Object.assign({}, state);
    newState.message = data;
    return newState;
  }),

  on(guide.sendPrompt, (state, data) => {
    const newState = Object.assign({}, state);
    newState.prompt = data;
    return newState;
  }),

  on(guide.sendSpotlight, (state, data) => {
    const newState = Object.assign({}, state);
    newState.spotlight = data;
    return newState;
  }),

  on(guide.startVideo, (state, data) => {
    const newState = Object.assign({}, state);
    newState.video = data;
    return newState;
  }),

  on(guide.hideAvatar, (state, data) => {
    const newState = Object.assign({}, state);
    delete newState.avatar;
    return newState;
  }),

  on(guide.hideMessage, (state, data) => {
    const newState = Object.assign({}, state);
    delete newState.message;
    return newState;
  }),

  on(guide.hidePrompt, (state, data) => {
    const newState = Object.assign({}, state);
    delete newState.prompt;
    return newState;
  }),

  on(guide.hideSpotlight, (state, data) => {
    const newState = Object.assign({}, state);
    delete newState.spotlight;
    return newState;
  }),

  on(guide.hideVideo, (state, video) => {
    const newState = Object.assign({}, state);
    delete newState.video;
    return newState;
  }),
);

export function guideReducer(state: any, action: any) {
  return _guideReducer(state, action);
}
