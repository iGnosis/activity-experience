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

  // Workaround for medianet not working
  private poseCount = 0
  private prod = true
  private game?: Phaser.Game;
  private onComplete: Function | undefined
  constructor(
    private store: Store<{ guide: GuideState, calibration: any, pose: any, announcement: AnnouncementState }>,
    private injector: Injector,
    private calibrationService: CalibrationService,
    private calibrationScene: CalibrationScene,
    private soundService: SoundsService,
    private sit2standService: SitToStandService,
  ) { }

  calibrationSuccessCount = 0
  calibrationStatus = 'error'

  observables$: any

  currentClass: 'unknown' | 'disabled' | 'sit' | 'stand' = 'unknown'

  index = -1
  sequence: any = []
  sit2StandExplained = false


  async welcomeUser() {

    // await this.sleep(3500)

    this.store.dispatch(guide.sendMessage({
      text: 'Hi!',
      position: 'center'
    }))
    this.sleep(50)
    this.store.dispatch(guide.updateAvatar({ name: 'mila' }))

    await this.sleep(this.prod ? 1000 : 300)

    this.store.dispatch(guide.sendMessage({
      text: 'My name is Mila. I am thrilled to be working with you today.',
      position: 'center'
    }))

    await this.sleep(this.prod ? 5000 : 300)

    this.store.dispatch(guide.sendMessage({
      text: 'I am here to guide you through today\'s session',
      position: 'center'
    }))

    await this.sleep(this.prod ? 5000 : 300)

    this.store.dispatch(guide.sendMessage({
      text: 'Before we start, we need to ensure a few things',
      position: 'bottom'
    }))

    await this.sleep(this.prod ? 3000 : 300)

    this.store.dispatch(guide.sendMessage({
      text: 'Firstly, we need to see you on the screen',
      position: 'bottom'
    }))

    await this.sleep(this.prod ? 3000 : 300)

    this.store.dispatch(guide.sendMessage({
      text: 'Please move around such that you can see your whole body inside the red box',
      position: 'bottom'
    }))

    // if by this time, poseCount is less than 10, then it means mediapipe has failed.
    // ask user to refresh the page
    if (this.poseCount < 10) {
      window.alert('Mediapipe failed to load - Please refresh the page')
    }

    // Start with the red box and enable the calibration service
    this.calibrationScene.drawCalibrationBox('error')
    this.calibrationService.enable()
    // Result of calibration to be captured in the subscribeToState method
  }

  async explainSit2Stand() {
    this.store.dispatch(guide.hideAvatar())
    this.store.dispatch(guide.hideMessage())
    this.store.dispatch(announcement.announce({ message: 'Excellent', timeout: 3000 }))
    await this.sleep(this.prod ? 3500 : 300)
    // this.store.dispatch(guide.updateAvatar({name: 'mila'}))
    this.store.dispatch(guide.sendSpotlight({ text: 'Starting Next Activity' }))
    await this.sleep(this.prod ? 3500 : 300)
    this.store.dispatch(guide.sendSpotlight({ text: 'SIT TO STAND' }))
    await this.sleep(this.prod ? 3500 : 300)
    this.store.dispatch(guide.hideSpotlight())
    await this.sleep(this.prod ? 200 : 100)
    this.store.dispatch(guide.updateAvatar({ name: 'mila' }))
    this.store.dispatch(guide.sendMessage({ text: 'Let\'s watch how the exercise is done first', position: 'bottom' }))
    await this.sleep(this.prod ? 2000 : 300)
    this.store.dispatch(guide.startVideo({ url: 'https://www.youtube.com/embed/chw2oMUrh4U?autoplay=1' }))
    await this.sleep(this.prod ? 10000 : 5000)
    this.store.dispatch(guide.hideVideo())
    // Enable sit2stand service
    this.sit2standService.enable()
    await this.sleep(this.prod ? 2000 : 300)
    this.store.dispatch(guide.sendMessage({ text: 'Before we start the exercise, please sit down on a chair', position: 'center' }))
    await this.sleep(this.prod ? 2000 : 300)
    this.store.dispatch(guide.sendMessage({ text: 'Grab a chair if you don\'t have one and please sit down.', position: 'bottom' }))
    await this.waitForClass('sit')
    this.store.dispatch(announcement.announce({ message: 'Perfect', timeout: 3000 }))
    await this.sleep(3500)

    this.store.dispatch(guide.sendMessage({ text: 'Now lets make this exercise interesting', position: 'center' }))
    await this.sleep(this.prod ? 2000 : 300)
    this.store.dispatch(guide.sendMessage({ text: 'When you see 👍 you STAND', position: 'center' }))
    await this.sleep(this.prod ? 2000 : 300)
    this.store.dispatch(guide.sendMessage({ text: 'Let us try it out...', position: 'center' }))
    await this.sleep(this.prod ? 3000 : 300)
    this.store.dispatch(guide.sendMessage({ text: 'Let us try it out...', position: 'bottom' }))
    this.store.dispatch(guide.sendPrompt({ className: 'round', text: '👍', position: 'center' }))
    await this.sleep(this.prod ? 3000 : 300)
    this.store.dispatch(guide.sendMessage({ text: 'Stand when you see 👍', position: 'bottom' }))
    await this.waitForClass('stand')
    this.store.dispatch(guide.hideAvatar())
    this.store.dispatch(guide.hidePrompt())
    this.store.dispatch(guide.hideMessage())
    await this.sleep(100)
    this.store.dispatch(announcement.announce({ message: 'Awesome!', timeout: 3000 }))
    await this.sleep(5000)
    this.store.dispatch(guide.updateAvatar({ name: 'mila', position: 'center' }))
    this.store.dispatch(guide.sendMessage({ text: 'That was great!', position: 'center' }))
    await this.sleep(this.prod ? 3000 : 300)
    this.store.dispatch(guide.hideAvatar())
    this.store.dispatch(guide.hidePrompt())
    this.store.dispatch(guide.hideMessage())
    await this.sleep(this.prod ? 3000 : 300)

    this.store.dispatch(guide.sendMessage({ text: 'Now when you see a 👎 you SIT', position: 'center' }))
    await this.sleep(this.prod ? 3000 : 300)
    this.store.dispatch(guide.sendMessage({ text: 'Let us give it a try?', position: 'center' }))
    await this.sleep(this.prod ? 1000 : 300)
    this.store.dispatch(guide.sendMessage({ text: 'Let us give it a try?', position: 'bottom' }))
    this.store.dispatch(guide.sendPrompt({ className: 'round', text: '👎', position: 'center' }))
    await this.sleep(this.prod ? 3000 : 300)
    this.store.dispatch(guide.sendMessage({ text: 'SIT when you see 👎', position: 'bottom' }))
    await this.waitForClass('sit')
    this.store.dispatch(guide.hideAvatar())
    this.store.dispatch(guide.hidePrompt())
    this.store.dispatch(guide.hideMessage())
    await this.sleep(100)
    this.store.dispatch(announcement.announce({ message: 'Amazing!', timeout: 3000 }))
    this.sit2StandExplained = true
    this.runSit2Stand()
    // Ask the person to sit down on a chair
    // Make it as close to the design as you comfortably can...
    // this.store.dispatch(guide.sendMessage({ text: 'Please sit down on a chair', position: 'bottom' , exitAnimation:'fadeOut'}));
    // await this.sleep(this.prod ? 3000 : 300);

    // checking if the user is sitting or not and starting activity only if he sit.
    // if (this.sit2standService.classify(this.currentPose).result === 'sit') {
    //     console.log('run again')
    //     this.sit2StandExplained = true;
    //     this.runSit2Stand();
    // }
  }


  async runSit2Stand() {
    if (!this.sit2StandExplained) {
      this.explainSit2Stand()
      return
    } else {
      // Run the sit2stand logic

      console.log('running sit2stand')
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
      if (results) {
        this.handlePose(results);
      }
    });

    // Subscribe for calibration status
    this.observables$.calibrationStatus = this.store.select(state => state.calibration.status)
    this.observables$.calibrationStatus.subscribe((newStatus: string) => {
      this.calibrationStatus = newStatus
      console.log('new Status', newStatus)
    })
  }

  unsubscribe() {
    // TODO: unsubscribe from all the events
  }

  handlePose(results: { pose: Results }) {
    console.log('handlePose:results:', results)
    this.poseCount++
    const calibrationResult = this.calibrationService.handlePose(results)

    // Call appropriate hook when status changes
    if (calibrationResult && (this.calibrationStatus !== calibrationResult.status)) {
      this.handleCalibrationResult(this.calibrationStatus, calibrationResult.status)
      this.calibrationStatus = calibrationResult.status
    }

    if (this.calibrationStatus == 'success' && this.sit2standService.isEnabled()) {
      const newClass = this.sit2standService.classify(results.pose).result
      this.handleClassChange(this.currentClass, newClass)
      this.currentClass = newClass
    }
  }

  async waitForClass(className: 'sit' | 'stand') {
    return new Promise((resolve) => {
      if (this.currentClass == className) resolve({})
      // set interval
      const interval = setInterval(() => {
        if (this.currentClass == className) {
          resolve({})
          clearInterval(interval)
        }
      }, 300)
    })
  }

  handleClassChange(oldClass: string, newClass: string) {
    // Do something?
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
    this.runSit2Stand()
  }

  handleCalibrationResult(oldStatus: string, newStatus: string) {
    switch (newStatus) {
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

    // this.soundService.startConstantDrum()
    this.startSit2StandScene()

    // if (this.calibrationSuccessCount == 1) {
    //   // First time success... Explain Sit2Stand

    // } else {
    //   // Second time success... Start from where we left off
    // }
  }

  handleCalibrationWarning(oldStatus: string, newStatus: string) {
    this.calibrationScene.drawCalibrationBox('warning')
    // TODO: If the earlier status was
  }

  handleCalibrationError(oldStatus: string, newStatus: string) {
    this.startCalibrationScene()
    this.calibrationScene.drawCalibrationBox('error')
    this.soundService.pauseConstantDrum()
  }

  async nextStep() {
    this.index += 1
    if (this.sequence.length > this.index) {
      const action = this.sequence[this.index]
      switch (action.type) {
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
      if (action.next != 'manual') {
        // if the next action can be executed automatically
        this.nextStep()
      }

    }
  }

  async runActivity() {

  }

  async handleAction(action: any) {
    if (action.action) {
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
      if (action.sync) await action.name()
      // @ts-ignore
      else action.name()
    }
  }

  async handleService(action: any) {
    const service = this.injector.get(action.name)
    // @ts-ignore
    service[action.method]()
  }

  async invokeComponentFunction(methodName: string, params: Array<any>) {
    // @ts-ignore
    if (this.component && typeof (this.component[methodName]) == 'function') {
      if (params) {
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
