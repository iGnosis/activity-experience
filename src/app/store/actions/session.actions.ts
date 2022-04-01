import { createAction, props } from "@ngrx/store";
import { ActivityState, SessionRow } from "src/app/types/pointmotion";

export const session = {
    startSession: createAction('[Session] Start session', props<SessionRow>()),
    startActivity: createAction('[Session] Start activity', props<ActivityState>()),
    addRep: createAction('[Session] Add Rep')
}