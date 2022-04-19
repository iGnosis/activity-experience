import { Injectable, Injector } from '@angular/core';
import { Store } from '@ngrx/store';
import { SessionComponent } from 'src/app/pages/session/session.component';
import { CalibrationScene } from 'src/app/scenes/calibration/calibration.scene';
import { calibration } from 'src/app/store/actions/calibration.actions';
import { guide } from 'src/app/store/actions/guide.actions';
import { GuideState, Results } from 'src/app/types/pointmotion';
import { CalibrationService } from '../calibration/calibration.service';
import { SoundsService } from '../sounds/sounds.service';

@Injectable({
  providedIn: 'root'
})
export class CoordinationService {
  
  private component: SessionComponent | undefined
  private prod = true
  private onComplete: Function | undefined
  constructor(
    private store: Store<{guide: GuideState, calibration: any, pose: any}>,
    private injector: Injector,
    private calibrationService: CalibrationService,
    private calibrationScene: CalibrationScene,
    private soundService: SoundsService
    ) { }
    
    calibrationSuccessCount = 0
    calibrationStatus = 'error'

    index = -1
    observables$: any 

    welcome: any = [
      
      // {
      //   type: 'action',
      //   action: guide.updateAvatar,
      //   data: {
      //     name: 'mila'
      //   }
      // },
      // {
      //   type: 'action',
      //   action: guide.sendMessage,
      //   data: {
      //     text: 'Hi!',
      //     position: 'center'
      //   }
      // },
      // {
      //   type: 'timeout',
      //   data: this.prod? 1000: 300
      // },
      // {
      //   type: 'action',
      //   action: guide.sendMessage,
      //   data: {
      //     text: 'My name is Mila. I am thrilled to be working with you today.',
      //     position: 'center'
      //   }
      // },
      
      // {
      //   type: 'timeout',
      //   data: this.prod? 5000: 300
      // },
      // {
      //   type: 'action',
      //   action: guide.sendMessage,
      //   data: {
      //     text: 'I am here to guide you through today\'s session',
      //     position: 'center'
      //   }
      // },
      // {
      //   type: 'timeout',
      //   data: this.prod? 5000: 300
      // },
      // {
      //   type: 'action',
      //   action: guide.sendMessage,
      //   data: {
      //     text: 'Before we start, we need to ensure a few things',
      //     position: 'bottom'
      //   }
      // },
      
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
          text: 'Please move around such that you can see yourself in the red box',
          position: 'bottom'
        }
      },
      {
        type: 'service',
        name: CalibrationScene,
        method: 'drawCalibrationBox',
        data: {
          args: ['error']
        }
      },
      {
        type: 'service',
        name: CalibrationService,
        method: 'enable',
        data: {
          args: []
        },
        next: 'manual'
      },
      {
        type: 'method',
        name: this.invokeComponentFunction,
        data: {
          args: ['Perfect'],
          name: 'announce'
        },
        sync: true
      },
      {
        type: 'action',
        action: guide.hideMessage,
        data: {}
      },
      {
        type: 'action',
        action: guide.hideAvatar,
        data: {}
      },
      {
        type: 'startNewSequence',
        name: 'sit2standTutorial'
      }
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
    sit2standTutorial = [
      
      {
        type: 'action',
        action: guide.sendMessage,
        data: {
          text: 'That was amazing',
          position: 'center'
        }
      },
      {
        type: 'timeout',
        data: 1000
      },
      {
        type: 'action',
        action: guide.hideMessage,
        data: {
          name: 'mila'
        }
      },
      {
        // Show the video 
      },
      {
        // 
      }
    ]
    sequence = this.welcome


    async welcomeUser() {
      
      this.store.dispatch(guide.updateAvatar({name: 'mila'}))
      this.store.dispatch(guide.sendMessage({
        text: 'Hi!',
        position: 'center'
      }))
      await this.sleep(this.prod? 1000: 300)
      this.store.dispatch(guide.sendMessage({
        text: 'My name is Mila. I am thrilled to be working with you today.',
        position: 'center'
      }))
      await this.sleep(this.prod? 5000: 300)
      this.store.dispatch(guide.sendMessage({
        text: 'I am here to guide you through today\'s session',
        position: 'center'
      }))
      await this.sleep(this.prod? 5000: 300)

      this.store.dispatch(guide.sendMessage({
        text: 'Before we start, we need to ensure a few things',
        position: 'bottom'
      }))

      await this.sleep(this.prod? 3000: 300)

      this.store.dispatch(guide.sendMessage({
        text: 'Firstly, we need to see you on the screen',
        position: 'bottom'
      }))

      await this.sleep(this.prod? 3000: 300)

      this.store.dispatch(guide.sendMessage({
        text: 'Please move around such that you can see yourself in the red box',
        position: 'bottom'
      }))
    
      this.calibrationScene.drawCalibrationBox('error')
      this.calibrationService.enable() 
    }

    start(component: SessionComponent, onComplete: Function) {
      this.component = component
      this.onComplete = onComplete
      this.subscribeToState()
      this.welcomeUser()
    }

    subscribeToState() {
      this.observables$ = {}

      // Subscribe to the pose
      this.observables$.pose = this.store.select(state => state.pose);
      this.observables$.pose.subscribe((results: { pose: Results }) => {
        this.handlePose(results);
      });

      // Subscribe for calibration status
      this.observables$.calibrationStatus = this.store.select(state => state.calibration.status)
      this.observables$.calibrationStatus.subscribe((newStatus: string) => {
        this.calibrationStatus = newStatus
        console.log(newStatus)
      })
    }

    unsubscribe() {
      // TODO: unsubscribe from all the events
    }

    handlePose(results: { pose: Results }) {
      const calibrationResult = this.calibrationService.handlePose(results)
      
      if(calibrationResult && this.calibrationStatus !== calibrationResult.status) {
        this.handleCalibrationResult(this.calibrationStatus, calibrationResult.status)
        this.calibrationStatus = calibrationResult.status
      }
    }

    handleCalibrationResult(oldStatus: string, newStatus: string) {
      switch(newStatus) {
        case 'warning':
          this.handleCalibrationWarning(oldStatus, newStatus)
          break
        case 'success':
          this.handleCalibrationSuccess(oldStatus, newStatus)
          break
        case 'error':
        default:
          this.handleCalibrationError(oldStatus, newStatus)
          break
      }
    }

    handleCalibrationSuccess(oldStatus: string, newStatus: string) {
      this.calibrationScene.drawCalibrationBox('success')
      this.calibrationSuccessCount += 1
      console.log('successful calibration ', this.calibrationSuccessCount);
      
      this.soundService.startConstantDrum()
      if (this.calibrationSuccessCount == 1) {
        // First time success... Explain Sit2Stand

        
      } else {
        // Second time success... Start from where we left off
      }
    }

    handleCalibrationWarning(oldStatus: string, newStatus: string) {
      this.calibrationScene.drawCalibrationBox('warning')
      // TODO: If the earlier status was 
    }

    handleCalibrationError(oldStatus: string, newStatus: string) {
      this.calibrationScene.drawCalibrationBox('error')
      this.soundService.pauseConstantDrum()
    }
    
    async nextStep() {
      this.index += 1
      if(this.sequence.length > this.index) {
        const action = this.sequence[this.index]
        switch(action.type) {
          case 'action':
            await this.handleAction(action)
            break;
          case 'timeout':
            await this.handleTimeout(action)
            break
          case 'method':
            this.handleMethod(action)
            break;
          
          case 'service':
            this.handleService(action)
            break;
          
            case 'startNewSequence':
              // TODO: track where we left off in the older sequence?
              // @ts-ignore
              this.sequence = this[action.name]
              this.index = -1
        }
        
        // @ts-ignore
        if(action.next != 'manual') {
          // if the next action can be executed automatically
          this.nextStep()
        }
        
      }
    }

    async runActivity() {
      
    }

    async handleAction(action: any) {
      if(action.action) {
        // @ts-ignore
        this.store.dispatch(action.action.call(this, action.data))
      }
    }

    async handleTimeout(action: any) {
      if (action.data) {
        // @ts-ignore
        await this.sleep(action.data)
      }
    }

    async handleMethod(action: any) {
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
    }

    async handleService(action: any) {
      const service = this.injector.get(action.name)
      // @ts-ignore
      service[action.method]()
    }
    
    async invokeComponentFunction(methodName: string, params: Array<any>){
      // @ts-ignore
      if(this.component && typeof(this.component[methodName]) == 'function') {
        if(params) {
          // @ts-ignore
          await this.component[methodName](...params)
        } else {
          // @ts-ignore
          await this.component[methodName]()
        }
        
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
  