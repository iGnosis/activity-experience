import { createReducer, on } from "@ngrx/store";
import { testStringAction } from "../actions/test.action";

let initialState = {
    name: '',
    age: 0
}

const _testReducer = createReducer(initialState, 
    on(testStringAction, (state, data) => {
        // console.log('state ', state);
        // console.log('data', data);
        return {
            name: data.name,
            age: data.age
        }
    })
)


export function testReducer(state:any, action:any) {
    return _testReducer(state, action);
}
