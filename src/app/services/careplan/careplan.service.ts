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
    "calibration": {
      type: 'full_body'
    },
    "events": [
      // Welcome stuff
      {
        "id": "event0",
        "source": 'session',
        "description": "Show a welcome message",
        "logging": {
          "debug": true,
          "error": true
        },
        "trigger": {
          "source": 'session',
          "name": "ready",
          "comment": "When the assets are loaded"
        },
        "actions": [
          {
            "component": 'spotlight',
            "handler": "show",
          },
          {
            "component": 'spotlight',
            "handler": "showMessages",
            "params": {
              id: '123',
              data: {
                messages: [
                  {text: 'Hi', timeout: 1000},
                  {text: 'Welcome to Sound Health', timeout: 300000},
                  {text: 'We will start with your calibration', timeout: 3000},
                ]
              }
            },
            "hooks": {
              "afterAction": [{
                "component": 'spotlight',
                "handler": "hide"
              }, {
                "component": "event",
                "handler": "dispatchEventId",
                "params": {
                  "id": "start_game"
                }
              }]
            }
          }
        ]
      }, 
      // After the welcome, start the game and media pipe
      {
        trigger: {
          id: "start_game"
        },
        actions: [
          {
            component: 'session',
            handler: 'startGame'
          }, 
          {
            component: 'session',
            handler: 'startMediaPipe'
          }
        ],
        source: 'event'
      }, 
      // While it's not calibrated
      {
        trigger: {
          source: 'calibration.service',
          name: 'error'
        },
        actions: [
          {
            component: 'sit2stand.service',
            handler: 'disable'
          },
        ],
      },
      // When it gets calibrated
      {
        trigger: {
          source: 'calibration.scene',
          name: 'completed'
        },
        actions: [
          {
            component: 'spotlight',
            handler: 'show'
          },
          {
            "component": 'spotlight',
            "handler": "showMessages",
            "params": {
              "id": '123',
              "data": {
                "messages": [
                  {"text": 'Perfect', timeout: 1000},
                  // {"text": 'Restarting the game', timeout: 3000},
                ]
              }
            },
            "hooks": {
              "afterAction": [{
                "component": 'calibration.scene',
                "handler": "startActivity",
                "hooks": {
                  "beforeAction": [
                    {
                      "component": "spotlight",
                      "handler": "hide"
                    },
                  ]
                }
              }]
            }
          },
          {
            component: 'sit2stand.service',
            handler: 'enable'
          }
        ],
      },
      // Calibration success
      {
        trigger: {
          source: 'calibration.service',
          name: 'success'
        },
        actions: [
          {
            component: 'sit2stand.service',
            handler: 'enable'
          },
        ],
      }
    ],
    activities: [
      'sit2stand'
    ],
    config: {
      'sit2stand': {
        reps: 5,
        repTimeout: 3000,
        pointDistanceThreshold: 0.25
      }
    }
  }
  
  constructor(private eventService: EventsService) { }
  
  async downloadCarePlan(sessionId: string) {
    console.log('downloading careplan');
    
    localStorage.setItem('careplan', JSON.stringify(this.careplan))
    this.eventService.setEventListeners(this.careplan)
    return this.careplan
  }

  getCarePlan(): CarePlan {
    return this.careplan
  }
}
