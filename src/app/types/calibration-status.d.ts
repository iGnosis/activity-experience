export declare class Calibration {
    status: CalibrationStatusType;
    details: CalibrationDetails;
}

export declare  enum CalibrationStatusType {
    SUCCESS = 'success',
    WARNING = 'warning',
    ERROR = 'error'
}

export declare  enum CalibrationDetails {
    MULTIPLE_PEOPLE_DETECTED = '1',
    NO_PERSON_DETECTED = '2',
    REQUIRED_POINTS_MISSING = '3',
    CALIBRATED = '4'
}

