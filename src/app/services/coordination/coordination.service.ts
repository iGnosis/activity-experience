import { Injectable, Injector } from '@angular/core';
import { Store } from '@ngrx/store';
import { SessionComponent } from 'src/app/pages/session/session.component';
import { CalibrationScene } from 'src/app/scenes/calibration/calibration.scene';
import { announcement } from 'src/app/store/actions/announcement.actions';
import { calibration } from 'src/app/store/actions/calibration.actions';
import { guide } from 'src/app/store/actions/guide.actions';
import { AnnouncementState, GuideState, Results } from 'src/app/types/pointmotion';
import { CalibrationService } from '../calibration/calibration.service';
import { SitToStandService } from '../classifiers/sit-to-stand/sit-to-stand.service';
import { SoundsService } from '../sounds/sounds.service';

@Injectable({
  providedIn: 'root'
})
export class CoordinationService {
  
  private prod = false
  private game?: Phaser.Game;
  private onComplete: Function | undefined
  constructor(
    private store: Store<{guide: GuideState, calibration: any, pose: any, announcement: AnnouncementState}>,
    private injector: Injector,
    private calibrationService: CalibrationService,
    private calibrationScene: CalibrationScene,
    private soundService: SoundsService,
    private sit2standService: SitToStandService,
    ) { }
    
    calibrationSuccessCount = 0
    calibrationStatus = 'error'
    
    observables$: any 

    index = -1
    sequence: any = []
    sit2StandExplained = false


    async welcomeUser() {

      this.store.dispatch(announcement.announce({message: 'Hello', timeout: 3000, background: '#FF0000'}))
      await this.sleep(3500)
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
    
      // Start with the red box and enable the calibration service
      this.calibrationScene.drawCalibrationBox('error')
      this.calibrationService.enable()
      // Result of calibration to be captured in the subscribeToState method
    }

    async explainSit2Stand() {
      // 
    }

    async runSit2Stand() {
      if (!this.sit2StandExplained) {
        this.explainSit2Stand()
        return
      } else {
        // Run the sit2stand logic
      }
    }

    start(game: Phaser.Game, onComplete: Function) {
      this.game = game
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

    async startCalibrationScene() {
      this.sit2standService.disable();
      if (this.game?.scene.isActive('sit2stand')) {
        this.game.scene.stop('sit2stand');
        console.log('sit2stand is active. turning off');
        this.game?.scene.start('calibration');
        console.log('start calibration');
        // this.action_startMediaPipe()
      } else {
        console.log('calibration is already active');
      }
    }

    startSit2StandScene() {
      this.sit2standService.enable();
      if (this.game?.scene.isActive('calibration')) {
        this.game.scene.stop('calibration');
        console.log('calibration is active. turning off');
        this.game?.scene.start('sit2stand');
        console.log('start sit 2 stand');
      } else {
        console.log('sit2stand is already active');
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
      this.startCalibrationScene()
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
  