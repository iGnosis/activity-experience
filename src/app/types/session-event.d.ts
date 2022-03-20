import { Action } from "./action";
import { EventSource } from "./event-source";
import { Logging } from "./logging";
import { Trigger } from "./trigger";

export type SessionEvent = {
    id?: string
    source: EventSource
    description?: string
    logging?: Logging
    trigger: Trigger
    actions: Array<Action>
}


