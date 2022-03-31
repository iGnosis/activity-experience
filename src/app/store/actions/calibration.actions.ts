import { createAction, props } from '@ngrx/store'

export const calibration = {
    success: createAction('[Calibration] Success', props<{pose: any, reason: string}>()),
    warning: createAction('[Calibration] Warning', props<{pose: any, reason: string}>()),
    error: createAction('[Calibration] Error', props<{pose: any, reason: string}>()),
}

