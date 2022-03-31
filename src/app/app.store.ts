// import { CalibrationStatus } from "./types/calibration-status";

export interface AppState {
    calibration: any,
    carePlan: any,
    frame: Uint8ClampedArray, 
    test: {name: string, age: number}
}