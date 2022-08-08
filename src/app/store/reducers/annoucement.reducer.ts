import { createReducer, on } from '@ngrx/store';
import { AnnouncementState } from 'src/app/types/pointmotion';
import { announcement } from '../actions/announcement.actions';

const initialState: AnnouncementState = {
  message: '',
};

const _announcementReducer = createReducer(
  initialState,

  on(announcement.announce, (state, data) => {
    return data;
  }),
);

export function announcementReducer(state: any, action: any) {
  return _announcementReducer(state, action);
}
