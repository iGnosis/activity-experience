import { createAction, props } from '@ngrx/store'

export const calibration = {
    success: createAction('[Calibration] Success', props<{pose: any, reason: String}>()),
    warning: createAction('[Calibration] Warning', props<{pose: any, reason: String}>()),
    error: createAction('[Calibration] Error', props<{pose: any, reason: String}>()),
}

