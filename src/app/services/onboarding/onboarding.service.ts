import { Injectable, Injector } from '@angular/core';
import { Store } from '@ngrx/store';
import { SessionComponent } from 'src/app/pages/session/session.component';
import { guide } from 'src/app/store/actions/guide.actions';
import { GuideState } from 'src/app/types/pointmotion';
import { CalibrationService } from '../calibration/calibration.service';
import { HolisticService } from '../holistic/holistic.service';

@Injectable({
  providedIn: 'root'
})
export class OnboardingService {

  private component: SessionComponent | undefined
  private prod = false
  constructor(
    private store: Store<{guide: GuideState}>,
    private injector: Injector
  ) { }

  index = -1
  sequence = [
    {
      type: 'method',
      name: this.invokeComponentFunction,
      data: {
        args: ['Ready?'],
        name: 'announce'
      },
      sync: true
    },
    {
      type: 'action',
      action: guide.updateAvatar,
      data: {
        name: 'mila'
      }
    },
    {
      type: 'action',
      action: guide.sendMessage,
      data: {
        text: 'Hi!',
        position: 'center'
      }
    },
    {
      type: 'timeout',
      data: this.prod? 1000: 300
    },
    {
      type: 'action',
      action: guide.sendMessage,
      data: {
        text: 'My name is Mila. I am thrilled to be working with you today.',
        position: 'center'
      }
    },
    
    {
      type: 'timeout',
      data: this.prod? 5000: 300
    },
    {
      type: 'action',
      action: guide.sendMessage,
      data: {
        text: 'I am here to guide you through today\'s session',
        position: 'center'
      }
    },
    {
      type: 'timeout',
      data: this.prod? 5000: 300
    },
    {

    },
    {
      type: 'action',
      action: guide.sendMessage,
      data: {
        text: 'Before we start, we need to ensure a few things',
        position: 'bottom'
      }
    },
    
    {
      type: 'timeout',
      data: this.prod? 3000: 300
    },
    {
      type: 'action',
      action: guide.sendMessage,
      data: {
        text: 'Firstly, we need to see you on the screen',
        position: 'bottom'
      }
      },
      {
        type: 'timeout',
        data: this.prod? 4000: 300
      },
    {
      type: 'action',
      action: guide.sendMessage,
      data: {
        text: 'Please move around such that you can see yourself in the box',
        position: 'bottom'
      }
    },
    {
      type: 'service',
      name: CalibrationService,
      method: 'enable',
      data: {
        args: []
      }
    }, 
    // {
    //   type: 'method',
    //   name: this.holisticService.start,
    //   data: {
    //     args: []
    //   },
    //   sync: true
    // }
    // {
    //   type: 'action',
    //   action: guide.hideMessage
    // },
    // {
    //   type: 'action',
    //   action: guide.hideAvatar
    // }
    // guide.sendMessage({text: 'Hi, I ', position: 'center'})
  ]

  async start(component: SessionComponent, onComplete: Function) {
    this.component = component
    this.index += 1
    if(this.sequence.length > this.index) {
      const action = this.sequence[this.index]
      switch(action.type) {
        case 'action':
          if(action.action) {
            // @ts-ignore
            this.store.dispatch(action.action.call(this, action.data))
          }
          break;
        case 'timeout':
          if (action.data) {
            // @ts-ignore
            await this.sleep(action.data)
          }
          break
        case 'method':
          if (action.name == this.invokeComponentFunction) {
            // @ts-ignore
            if (action.sync) {
              // @ts-ignore
              await this.invokeComponentFunction(action.data.name, action.data.args) // TODO: support sending arguments
            } else {
              // @ts-ignore
              this.invokeComponentFunction(action.data.name)
            }
            
          } else if (action.name) {
            // @ts-ignore
            if(action.sync) await action.name()
            // @ts-ignore
            else action.name()
          }
          break;

        case 'service':
          const service = this.injector.get(action.name)
          // @ts-ignore
          service[action.method]()
      }
    }

    this.start(component, onComplete)
  }

  async invokeComponentFunction(methodName: string, params: Array<any>){
    // @ts-ignore
    if(this.component && typeof(this.component[methodName]) == 'function') {
      // @ts-ignore
      await this.component[methodName](...params)
    }
    
  }
  async sleep(timeout: number) {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        resolve({})
      }, timeout)
    })
  }
}
