import { createReducer, on } from "@ngrx/store";
import { SessionState } from "src/app/types/pointmotion";
import { session } from "../actions/session.actions";

const initialState: SessionState = {}

const _sessionReducer = createReducer(initialState, 
    on(session.startSession, (state, data)=> {
        return {}
    }),
    on(session.startActivity, (state, data) => {
        state.currentActivity = data
        return state
    }),
    on(session.addRep, (state, data) => {
        if (state.currentActivity){
            state.currentActivity.repsCompleted = state.currentActivity.repsCompleted || 0
            state.currentActivity.repsCompleted += 1
        }
        return state
    })
)

export function sessionReducer(state:any, action:any) {
    return _sessionReducer(state, action)
}