import { SessionEvent } from "./session-event";
import { Therapist } from "./therapist";

export type CarePlan = {
    name: string
    createdBy?: Therapist
    assets: any
    events: Array<SessionEvent>
    // trigger: Trigger
    // actions: Array<Action>
}