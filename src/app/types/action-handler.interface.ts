export class ActionHandler {
  actions?: Array<any>;

  subscribedEvents = {
    namespace: {
      component: {
        id: {
          // all other data related to the event
        },
        '*': {
          // catch all
        },
      },
    },
  };
  componentName: string;

  constructor(settings: { name: string }) {
    this.componentName = settings.name;
  }

  registerAction(action: any) {
    this.actions?.push(action);
    // Subscribe and create an observer
    // Subscribe to observables
  }

  handleEvent(event: any) {
    // if the event has an id... directly execute that...
    // if (this.subscribedEvents[event.namespace]) {
    // if the event name is registered
    // if the event has an id...
    // }
  }
}

export class Action {
  name?: string;
  handler?: any;

  constructor(name: string, handler: any) {
    this.name = name;
    this.handler = handler;
  }
}
