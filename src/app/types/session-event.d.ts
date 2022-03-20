import { EventSource } from "./event-source";
import { Logging } from "./logging";

export type SessionEvent = {
    id: string
    source: EventSource
    description?: string
    logging: Logging
}


