import { CalibrationStatus } from "./types/calibration-status";

export interface AppState {
    calibration: CalibrationStatus,
    carePlan: any,
    frame: Uint8ClampedArray, 
}