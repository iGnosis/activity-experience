export type ActionHook = {
    beforeAction: Array<any> 
    afterAction: Array<any>
    onSuccess: Array<any>
    onFailure: Array<any>
}

export type Action = {
    component: string
    handler: string
    params: ActionParams
    hooks?: ActionHook
}


declare type ActionParams = {
    id?: string 
    data?: any
}

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


export type CarePlanAssets = {
    
}

export type CarePlan = {
    name: string
    createdBy?: Therapist
    assets: any
    events: Array<SessionEvent>
    // trigger: Trigger
    // actions: Array<Action>
}


// export const EventSource = {
//     Read: 'r',
//     Write: 'w',
//     Execute: 'x'
//   } as const;
//   type Permission = typeof EventSource[keyof typeof EventSource]; // 'r' | 'w' | 'x'
  
  

// export enum EventSource {
//     system = 'system',
//     user = 'user',
//     activity = 'activity',
//     spotlight = 'spotlight',
//     guide = 'guide'
// }


export type Logging = {
    level?: LogLevel
    debug?: boolean
    error?: boolean
    info?: boolean
    verbose?: boolean
}


declare enum LogLevel {
    verbose = 'verbose',
    debug = 'debug',
    info = 'info',
    error = 'error'
}


export type SessionEvent = {
    id?: string
    source: string
    description?: string
    logging?: Logging
    trigger: Trigger
    actions: Array<Action>
}


export type Therapist = {
    id: string
    firstName: string
    lastName: string 
}



/**
 * Each trigger must have an id or (name, source) pair
 */
 export type Trigger = {

    /**
     * events can be dispatched using an event id.
     */
    id?: string

    /**
     * name of the event
     */
    name?: string
    source?: string
    
    comment?: string
}


