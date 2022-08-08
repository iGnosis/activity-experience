import { createAction, props } from '@ngrx/store';
import {
  ActivityStage,
  ActivityState,
  Genre,
  SessionRow,
  SessionStateField,
} from 'src/app/types/pointmotion';

export const session = {
  startSession: createAction('[Session] Start session', props<SessionRow>()),
  startActivity: createAction('[Session] Start activity', props<ActivityState>()),
  updateSessionState: createAction('[Session] Update state', props<SessionStateField>()),
  addRep: createAction('[Session] Add Rep'),
  updateConfig: createAction('[Session] Update Config', props<SessionRow>()),
  setPreSessionMood: createAction('[Session] Set Pre-Session Mood', props<{ mood: string }>()),
  setPostSessionMood: createAction('[Session] Set Post-Session Mood', props<{ mood: string }>()),
  setGenre: createAction('[Session] Set Genre', props<{ genre: Genre }>()),
  setSessionEnded: createAction('[Session] Set Session-Ended'),
};
