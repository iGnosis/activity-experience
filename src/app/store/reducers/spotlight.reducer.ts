import { createReducer, on } from "@ngrx/store";
import { spotlight } from "../actions/spotlight.actions";

const initialState = 0

const _spotlightReducer = createReducer(initialState,
  on(spotlight.celebrate, (state, data) => {
    return Math.random()
  })
)


export function spotlightReducer(state: any, action: any) {
  return _spotlightReducer(state, action);
}
