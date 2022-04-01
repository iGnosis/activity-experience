// import { CalibrationStatus } from "./types/calibration-status";

import { GuideActionShowMessagesDTO, SessionState } from "./types/pointmotion";

export interface AppState {
    calibration: any,
    carePlan: any,
    frame: Uint8ClampedArray, 
    test: {name: string, age: number},
    guide: GuideActionShowMessagesDTO,
    session: SessionState,
    spotlight: any
}