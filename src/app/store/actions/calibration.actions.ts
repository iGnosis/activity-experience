import { createAction } from '@ngrx/store'

export const calibration = {
    invalid: createAction('[Calibration] Invalid'),
    multiplePeopleDetected: createAction('[Calibration] Multiple People'),
    noPersonDetected: createAction('[Calibration] No Person Found'),
    outOfBound: createAction('[Calibration] Out of bound')
}

