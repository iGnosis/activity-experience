export class CalibrationStatus {
    status: CalibrationStatusType;
    value: boolean;
}

export enum CalibrationStatusType {
    MULTIPLE_PEOPLE_DETECTED = '1',
    NO_PERSON_DETECTED = '2',
    REQUIRED_POINTS_MISSING = '3',
    CALIBRATED = '4'
}