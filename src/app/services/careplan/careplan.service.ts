import { Injectable } from '@angular/core';
import { CarePlan } from 'src/app/types/careplan';
import { EventSource } from 'src/app/types/event-source.d';

@Injectable({
  providedIn: 'root'
})
export class CareplanService {
  
  careplan: CarePlan = {
    "name": "Name of the careplan",
    // "createdBy": {},
    "assets": {
      "audio": {
        "bg": "https://example.com/bg.mp3",
        "chime": "https://example.com/bg.mp3",
        "drum": "https://example.com/bg.mp3"
      }
    },
    "events": [
      {
        "id": "event0",
        "source": EventSource.system,
        "description": "Show a welcome message",
        "logging": {
          "debug": true,
          "error": true
        },
        "trigger": {
          "source": EventSource.system,
          "name": "ready",
          "comment": "When the assets are loaded"
        },
        "actions": [
          {
            "component": EventSource.spotlight,
            "handler": "welcome",
            "params": {
              "id": 'someid',
              "data": {
                "messages": [
                  "Hi! ${user.name}",
                  "Welcome back."
                ],
                "interval": 1000
              }
            }
          }
        ]
      }, 
      {
        "source": EventSource.system,
        "description": "Introduce the guide",
        "trigger": {
          "source": EventSource.spotlight,
          "name": "hidden",
          "id": "spotlight0",
        },
        "actions": [
          {
            "component": EventSource.guide,
            "handler": "showMessages",
            "hooks": {
              "beforeAction": [

              ],
              "onSuccess": [
                {
                  "type": "hook",
                  "hook": {
                    "name": "onMessagesComplete",
                  }
                },
              ],
              "onFailure": [
                // catch stuff
              ],
              "afterAction": [
                // finally stuff
              ]
            },
            "params": {
              "id": "guide0",
              "data": {
                "messages": [
                  "Hi! ${user.name}",
                  "Welcome back."
                ],
                "customData": "${trigger.data.customData} -- access custom data from trigger", 
                "interval": 1000
              },
              
            }
          }
        ]
      }
    ]
  }
  
  constructor() { }
  
  async downloadCarePlan(sessionId: string) {
    localStorage.setItem('careplan', JSON.stringify(this.careplan))
    this.registerEventListeners()
    return this.careplan
  }

  getCarePlan() {
    this.careplan
  }

  registerEventListeners() {
    this.careplan.events.forEach(event => {
      const actions = event.actions
      actions.forEach(action => {
        // From each action, find the component and add the event listeners
      })
    })
  }
}
