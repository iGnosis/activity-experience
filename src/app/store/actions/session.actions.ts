import { createAction, props } from "@ngrx/store";
import { ActivityState } from "src/app/types/pointmotion";

export const session = {
    startSession: createAction('[Session] Start session'),
    startActivity: createAction('[Session] Start activity', props<ActivityState>()),
    addRep: createAction('[Session] Add Rep')
}