import { ActionHook } from "./action-hook"

export type Action = {
    component: EventSource
    handler: string
    params: ActionParams
    hooks: ActionHook
}


declare type ActionParams = {
    id?: string 
    data?: any
}