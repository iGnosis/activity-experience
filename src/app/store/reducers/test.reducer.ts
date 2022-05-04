import { createReducer, on } from '@ngrx/store';
import { testStringAction } from '../actions/test.action';

const initialState = {
  name: '',
  age: 0,
};

const _testReducer = createReducer(
  initialState,
  on(testStringAction, (state, data) => {
    return {
      name: ' prefix' + data.name,
      age: data.age,
    };
  }),
);

export function testReducer(state: any, action: any) {
  return _testReducer(state, action);
}

// Action Dispatched --> Reducer Executed --> State Updated  --> Subscribed methods updated
