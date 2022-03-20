import { Injectable } from '@angular/core';
import { Action, CarePlan } from 'src/app/types/pointmotion';

@Injectable({
  providedIn: 'root'
})
export class EventsService {

  
  /*
  registeredEvents = {
    eventSource: {
      eventName: [
        // actions
      ]
    },
    eventId: [
      // actions
    ]
  }
  */
  registeredEvents: any

  /*
  context = {
    guide: GuideComponent,
    spotlight: SpotlightComponent
  }
  */
  contexts: any

  dispatcher: any = {}

  constructor() {}

  setEventListeners(careplan:CarePlan) {
    if(careplan && Array.isArray(careplan.events)) {
      const events = careplan.events
      this.registeredEvents = {}
      events.forEach(event => {
        if(event.trigger.id) {
          this.registeredEvents[event.trigger.id] = event.actions
        } else if (event.trigger.name && event.trigger.source) {
          this.registeredEvents[event.trigger.source] = this.registeredEvents[event.trigger.source] || {}
          this.registeredEvents[event.trigger.source][event.trigger.name] = event.actions
        } else {
          console.error(event)
          console.error('Event must have either an id or (name, source) pair defined')
        }
      })
    } else {
      throw new Error('No care plan found')
    }

    console.log(this.registeredEvents);
  }

  /**
   * 
   * @param key
   * @param context 
   * @returns Dispatcher, which contains the helper function to dispatch events by name or id
   */
  addContext(key: string, context: any) {
    this.contexts = this.contexts || {}
    this.contexts[key] = context
    
    this.dispatcher[key] = new Object()
    this.dispatcher[key].dispatchEventName = (event: string, data: any) => {
      this.dispatchEventName(key, event, data)
    }
    this.dispatcher[key].dispatchEventId = (id: string, data: any) => {
      this.dispatchEventId(id, data)
    }

    return this.dispatcher[key]
  }

  dispatchEventName(source: string, event: string, data: any) {
    console.log(this.contexts[source]);
    
    if (!this.registeredEvents[source]) {
      console.log(`Event source ${source} not registered`)
    } else if (!this.registeredEvents[source][event]) {
      console.log(`Event name ${event} not registered`)
    } else if(Array.isArray(this.registeredEvents[source][event])){
      // Extract the actions from the trigger
      console.log(this.registeredEvents[source][event])
      // Execute the events
      this.registeredEvents[source][event].forEach((action: Action) => {
        if (this.contexts[action.component]) {
          if (typeof (this.contexts[action.component]['event_' + action.handler]) == 'function') {
            // TODO: Handle hooks
            this.contexts[action.component]['event_' + action.handler].call(this.contexts[action.component], action.params)
          } else {
            throw new Error(`event_${action.handler} function not defined in ${action.component}`)
          }
        } else {
          throw new Error(`Component ${action.component} not available to handle events`)
        }
      })
      // this.contexts[source]['event_' + event].call(this.contexts[source], data)
    }
  }

  dispatchEventId(id: string, data: any) {

  }

  removeContext(key: string) {
    delete(this.contexts[key])
  }

}
