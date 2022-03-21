import { Injectable } from '@angular/core';
// import { CarePlan } from 'src/app/types/pointmotion';
import { CarePlan } from '../../types/pointmotion.d';
import { EventsService } from '../events/events.service';

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
        "source": 'system',
        "description": "Show a welcome message",
        "logging": {
          "debug": true,
          "error": true
        },
        "trigger": {
          "source": 'system',
          "name": "ready",
          "comment": "When the assets are loaded"
        },
        "actions": [
          {
            "component": 'spotlight',
            "handler": "showMessages",
            "params": {
              id: '123',
              data: {
                messages: [
                  {text: 'hi', timeout: 3000},
                  {text: 'hello', timeout: 1000},
                ]
              }
            }
          }
        ]
      }, 
      {
        "source": 'system',
        "description": "Introduce the guide",
        "trigger": {
          "source": 'spotlight',
          "name": "hidden",
          "id": "spotlight0",
        },
        "actions": [
          {
            "component": 'guide',
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
  
  constructor(private eventService: EventsService) { }
  
  async downloadCarePlan(sessionId: string) {
    console.log('downloading careplan');
    
    localStorage.setItem('careplan', JSON.stringify(this.careplan))
    this.eventService.setEventListeners(this.careplan)
    return this.careplan
  }

  getCarePlan() {
    this.careplan
  }
  
}
