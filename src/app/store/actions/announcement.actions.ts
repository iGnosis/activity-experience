import { createAction, props } from '@ngrx/store';
import { AnnouncementState } from 'src/app/types/pointmotion';

export const announcement = {
  announce: createAction('[Announcement] Announce', props<AnnouncementState>()),
};
