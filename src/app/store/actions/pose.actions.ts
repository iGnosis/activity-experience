import { Results } from '@mediapipe/holistic'
import { createAction, props } from '@ngrx/store'

export const pose = {
    send: createAction('[Pose] Send', props<{pose: Results}>())
}

