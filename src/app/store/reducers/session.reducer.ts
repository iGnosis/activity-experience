import { createReducer, on } from "@ngrx/store";
import { SessionState } from "src/app/types/pointmotion";
import { session } from "../actions/session.actions";




function saveToLocalStorage(session: any) {
    console.log('session', JSON.stringify(session));
    // localStorage.setItem('session', JSON.stringify(session))
}

function getFromLocalStorage() {
    return {}
    // return (JSON.parse(localStorage.getItem('session') || '{}') || {}) as SessionState
}

const initialState: SessionState = getFromLocalStorage()

const _sessionReducer = createReducer(initialState, 

    on(session.updateConfig, (state, data) => {
        console.log(data)
        const newState = Object.assign({}, state)
        newState.session = Object.assign({}, data)
        console.log(newState)
        return newState
    }),
    on(session.setPreSessionMood, (state, data) => {
        const newState = Object.assign({}, state)
        newState.session? newState.session.preSessionMood = data.mood: null
        return newState
    }),
    on(session.setPostSessionMood, (state, data) => {
        const newState = Object.assign({}, state)
        newState.session? newState.session.postSessionMood = data.mood: null
        return newState
    }),
    on(session.startSession, (state, data)=> {
        const newState = Object.assign({}, state)
        return newState
    }),
    on(session.startActivity, (state, data) => {
        const newState = Object.assign({}, state)
        newState.currentActivity = data
        saveToLocalStorage(newState)
        return newState
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