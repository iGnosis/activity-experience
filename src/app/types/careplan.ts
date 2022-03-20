import { Action } from "./action";
import { Therapist } from "./therapist";
import { Trigger } from "./trigger";

export type CarePlan = {
    name: string
    createdBy: Therapist
    assets: any
    trigger: Trigger
    actions: Array<Action>
}