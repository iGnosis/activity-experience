import { ActionHook } from "./action-hook"
import { EventSource } from "./event-source"

export type Action = {
    component: EventSource
    handler: string
    params: ActionParams
    hooks?: ActionHook
}


declare type ActionParams = {
    id?: string 
    data?: any
}