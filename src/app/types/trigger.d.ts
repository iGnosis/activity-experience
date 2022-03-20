import { EventSource } from "./event-source";

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
    source?: EventSource
    
    comment?: string
}