import { createAction, props } from '@ngrx/store';
import { ActivityState, SessionRow } from 'src/app/types/pointmotion';

export const session = {
  startSession: createAction('[Session] Start session', props<SessionRow>()),
  startActivity: createAction('[Session] Start activity', props<ActivityState>()),
  addRep: createAction('[Session] Add Rep'),
  updateConfig: createAction('[Session] Update Config', props<SessionRow>()),
  setPreSessionMood: createAction('[Session] Set Pre-Session Mood', props<{ mood: string }>()),
  setPostSessionMood: createAction('[Session] Set Post-Session Mood', props<{ mood: string }>()),
  setSessionEnded: createAction('[Session] Set Session-Ended'),
};
