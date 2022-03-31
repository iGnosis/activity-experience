import { createReducer, on } from "@ngrx/store";
import { guide } from "../actions/guide.actions";

const initialState = {}


const _guideReducer = createReducer(initialState, 
    on(guide.sendMessages, (state, data) => {
        console.log(data)
        
        return {
            data: data.data
        }
    })
)


export function guideReducer(state:any, action:any) {
    return _guideReducer(state, action);
}
