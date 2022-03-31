import { Injectable, NgZone } from '@angular/core';
import { Action, CarePlan, EventActionDispatchEventIdDTO, EventActionDispatchEventNameDTO } from 'src/app/types/pointmotion';

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

  constructor(private ngZone: NgZone) {
    this.addContext('event', this)
  }

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

    this.log(this.registeredEvents);
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

    // Add the context to window object for debugging
    // @ts-ignore
    window.pm = window.pm || {}
    // @ts-ignore
    window.pm[key] = context
    // @ts-ignore
    window.ng = this.ngZone
    
    this.dispatcher[key] = new Object()
    this.dispatcher[key].dispatchEventName = async (event: string, data: any) => {
      await this.dispatchEventName(key, event, data)
    }
    this.dispatcher[key].dispatchEventId = async (id: string, data: any) => {
      await this.dispatchEventId(id, data)
    }

    return this.dispatcher[key]
  }

  async action_dispatchEvent(data: EventActionDispatchEventNameDTO) {
    await this.dispatchEventName('event', data.name, data.data)
  }

  async action_dispatchEventId(data: EventActionDispatchEventIdDTO) {
    await this.dispatchEventId(data.id, data.data)
  }

  async dispatchEventName(source: string, event: string, data: any) {
    this.log('Dispatching Event (source, event):', source, event);
    
    if (!this.registeredEvents[source]) {
      this.log(`Event source ${source} not registered`)
    } else if (!this.registeredEvents[source][event]) {
      this.log(`Event name ${event} not registered`)
    } else if(Array.isArray(this.registeredEvents[source][event])){
      // Extract the actions from the trigger and execute the actions
      for(const action of this.registeredEvents[source][event]) {
        this.log('Executing actions on (source, event):', source, event);
        await this.executeAction(action)
      }
    }
  }

  async dispatchEventId(id: string, data: any) {
    this.log('Dispatching Event (id) ', id);
    if (!this.registeredEvents[id]) {
      this.log(`Event id ${id} not registered`)
    } else if(Array.isArray(this.registeredEvents[id])){
      // Extract the actions from the trigger and execute the actions
      for(const action of this.registeredEvents[id]) {
        this.log('Executing actions on (id):', id);
        await this.executeAction(action)
      }
    }
  }

  // TODO: Implement a scalable way to 
  async executeAction(action: Action) {
    // Check that the action component is registered
    this.log('executing action ', action.component, action.handler);
    
    if (this.contexts[action.component]) {
      if (typeof (this.contexts[action.component]['action_' + action.handler]) == 'function') {
        
        // Execute the beforeAction hooks
        if(action.hooks && action.hooks.beforeAction) {
          this.log('Executing beforeAction hooks ', action.component, action.handler);
          for(const hookAction of action.hooks.beforeAction) {
            await this.executeAction(hookAction)
          }
        }

        // Execute the main action. 
        try {
          this.log('Executing the main function', action.component, action.handler);
          await this.contexts[action.component]['action_' + action.handler].call(this.contexts[action.component], action.params)
          if(action.hooks && action.hooks.onSuccess) {
            this.log('Executing onSuccess hook', action.component, action.handler);
            for(const hookAction of action.hooks.onSuccess) {
              await this.executeAction(hookAction)
            }
          }
        } catch (err) {
          console.error(err)
          // Execute the onError hook, if present
          if(action.hooks && action.hooks.onFailure) {
            this.log('Executing onFailure hook', action.component, action.handler);
            for(const hookAction of action.hooks.onFailure) {
              await this.executeAction(hookAction)
            }
          }
        } finally {
          this.log('Executing afterAction hook', action.component, action.handler);
          if(action.hooks && action.hooks.afterAction) {
            for(const hookAction of action.hooks.afterAction) {
              await this.executeAction(hookAction)
            }
          }
        }
        
      } else {
        throw new Error(`event_${action.handler} function not defined in ${action.component}`)
      }
    } else {
      throw new Error(`Component ${action.component} not available to handle events`)
    }
  }

  removeContext(key: string) {
    delete(this.contexts[key])
  }


  log(...args: any) {
    if(true) {
      console.log(args)
    }
  }

}
