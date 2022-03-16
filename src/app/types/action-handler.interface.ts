export interface ActionHandler {
    getActions(): Array<Action>
}

export class Action {
    name?: string;
    handler?: Function

    constructor(name: string, handler: Function) {
        this.name = name
        this.handler = handler
    }
}