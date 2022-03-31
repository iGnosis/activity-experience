// import { CalibrationStatus } from "./types/calibration-status";

import { GuideActionShowMessagesDTO } from "./types/pointmotion";

export interface AppState {
    calibration: any,
    carePlan: any,
    frame: Uint8ClampedArray, 
    test: {name: string, age: number},
    guide: GuideActionShowMessagesDTO
}