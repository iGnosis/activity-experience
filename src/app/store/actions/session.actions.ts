import { createAction, props } from '@ngrx/store';
import { ActivityState, PauseActivityState, SessionRow } from 'src/app/types/pointmotion';

export const session = {
  startSession: createAction('[Session] Start session', props<SessionRow>()),
  startActivity: createAction('[Session] Start activity', props<ActivityState>()),
  pauseActivity: createAction('[Session] Pause activity', props<PauseActivityState>()),
  addRep: createAction('[Session] Add Rep'),
  updateConfig: createAction('[Session] Update Config', props<SessionRow>()),
  setPreSessionMood: createAction('[Session] Set Pre-Session Mood', props<{ mood: string }>()),
  setPostSessionMood: createAction('[Session] Set Post-Session Mood', props<{ mood: string }>()),
};
