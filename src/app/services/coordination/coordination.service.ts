import { Injectable, Injector } from '@angular/core';
import { Store } from '@ngrx/store';
import { SessionComponent } from 'src/app/pages/session/session.component';
import { CalibrationScene } from 'src/app/scenes/calibration/calibration.scene';
import { announcement } from 'src/app/store/actions/announcement.actions';
import { calibration } from 'src/app/store/actions/calibration.actions';
import { guide } from 'src/app/store/actions/guide.actions';
import { AnnouncementState, CalibrationState, GuideState, Results } from 'src/app/types/pointmotion';
import { CalibrationService } from '../calibration/calibration.service';
import { SitToStandService } from '../classifiers/sit-to-stand/sit-to-stand.service';
import { SoundsService } from '../sounds/sounds.service';
import { AnalyticsService } from '../analytics/analytics.service';
import { v4 } from 'uuid';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class CoordinationService {
  
  // Workaround for medianet not working
  private poseCount = 0
  private prod = true
  private game?: Phaser.Game;
  private onComplete: Function | undefined
  successfulAttempts = 0
  activityStatus: 'welcome' | 'explain' | 'pre' | 'play' | 'post' = 'welcome'
  constructor(
    private store: Store<{ guide: GuideState, calibration: any, pose: any, announcement: AnnouncementState }>,
    private injector: Injector,
    private calibrationService: CalibrationService,
    private calibrationScene: CalibrationScene,
    private soundService: SoundsService,
    private sit2standService: SitToStandService,
    private analyticsService: AnalyticsService,
    private router: Router
    ) { }
    
    calibrationSuccessCount = 0
    calibrationStatus = 'error'
    
    observables$: any
    
    currentClass: 'unknown' | 'disabled' | 'sit' | 'stand' = 'unknown'
    
    index = -1
    sequence: any = []
    
    activityId = '0fa7d873-fd22-4784-8095-780028ceb08e'
    attemptId = v4()
    taskId = v4()
    
    previousPose!: Results;
    currentPose !: Results;
    isWaitingForReaction = false
    
    async welcomeUser() {
      this.activityStatus = 'welcome'
      
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
        this.store.dispatch(guide.sendMessage({
          text: 'Ooops! Seems like our AI failed to load. Please reload the page and try again?',
          position: 'center'
        }))
      }
      
      // Start with the red box and enable the calibration service
      this.calibrationScene.drawCalibrationBox('error')
      this.calibrationService.enable()
      // Result of calibration to be captured in the subscribeToState method
    }
    
    async explainSit2Stand() {
      this.activityStatus = 'explain'
      this.store.dispatch(guide.hideAvatar())
      this.store.dispatch(guide.hideMessage())
      this.store.dispatch(announcement.announce({message: 'Excellent', timeout: 3000}))
      await this.sleep(this.prod? 3500: 300)
      // this.store.dispatch(guide.updateAvatar({name: 'mila'}))
      this.store.dispatch(guide.sendSpotlight({text: 'Starting Next Activity'}))
      // activity started
      this.analyticsService.sendActivityEvent({
        activity: this.activityId,
        event_type: 'activityStarted',
      });  
      
      await this.sleep(this.prod? 3500: 300)
      this.store.dispatch(guide.sendSpotlight({text: 'SIT TO STAND'}))
      await this.sleep(this.prod? 3500: 300)
      this.store.dispatch(guide.hideSpotlight())
      await this.sleep(this.prod? 200: 100)
      this.store.dispatch(guide.updateAvatar({name:'mila'}))
      this.store.dispatch(guide.sendMessage({text: 'Let\'s watch how the exercise is done first', position: 'bottom'}))
      await this.sleep(this.prod? 2000: 300)
      
      this.soundService.pauseConstantDrum()
      this.store.dispatch(guide.startVideo({url: 'https://www.youtube.com/embed/chw2oMUrh4U?autoplay=1'}))
      await this.sleep(this.prod? 10000: 5000)
      this.store.dispatch(guide.hideVideo())
      this.soundService.startConstantDrum()
      
      // Enable sit2stand service
      this.sit2standService.enable()
      await this.sleep(this.prod? 2000: 300)
      this.store.dispatch(guide.sendMessage({text: 'Before we start the exercise, please sit down on a chair', position: 'center'}))
      await this.sleep(this.prod? 2000: 300)
      this.store.dispatch(guide.sendMessage({text: 'Grab a chair if you don\'t have one and please sit down.', position: 'bottom'}))
      await this.waitForClass('sit')
      this.store.dispatch(announcement.announce({message: 'Perfect', timeout: 3000}))
      await this.sleep(3500)
      
      this.store.dispatch(guide.sendMessage({text: 'Now lets make this exercise interesting', position: 'center'}))
      await this.sleep(this.prod? 2000: 300)
      this.store.dispatch(guide.sendMessage({text: 'When you see an ODD number you STAND', position: 'center'}))
      await this.sleep(this.prod? 2000: 300)
      this.store.dispatch(guide.sendMessage({text: 'Let us try it out...', position: 'center'}))
      await this.sleep(this.prod? 3000: 300)
      this.store.dispatch(guide.sendMessage({text: 'Let us try it out...', position: 'bottom'}))
      this.store.dispatch(guide.sendPrompt({className:'round', text: '1', position: 'center'}))
      await this.sleep(this.prod? 3000: 300)
      this.store.dispatch(guide.sendMessage({text: 'Stand when you see an ODD number', position: 'bottom'}))
      await this.waitForClass('stand')
      this.soundService.playNextChord()
      
      this.store.dispatch(guide.hideAvatar())
      this.store.dispatch(guide.hidePrompt())
      this.store.dispatch(guide.hideMessage())
      await this.sleep(100)
      this.store.dispatch(announcement.announce({message: 'Awesome!', timeout: 3000}))
      await this.sleep(3500)
      
      
      this.store.dispatch(guide.sendMessage({text: 'That was great!', position: 'center'}))
      this.store.dispatch(guide.updateAvatar({name: 'mila', position: 'center'}))
      await this.sleep(this.prod? 3000: 300)
      
      this.store.dispatch(guide.sendMessage({text: 'Now when you see an EVEN number you SIT', position: 'center'}))
      await this.sleep(this.prod? 3000: 300)
      this.store.dispatch(guide.sendMessage({text: 'Let us give it a try?', position: 'center'}))
      await this.sleep(this.prod? 1000: 300)
      this.store.dispatch(guide.sendMessage({text: 'Let us give it a try?', position: 'bottom'}))
      this.store.dispatch(guide.sendPrompt({className:'round', text: '12', position: 'center'}))
      await this.sleep(this.prod? 3000: 300)
      this.store.dispatch(guide.sendMessage({text: 'SIT when you see an EVEN number', position: 'bottom'}))
      await this.waitForClass('sit')
      this.soundService.playNextChord()
      
      this.store.dispatch(guide.hideAvatar())
      this.store.dispatch(guide.hidePrompt())
      this.store.dispatch(guide.hideMessage())
      await this.sleep(100)
      this.store.dispatch(announcement.announce({message: 'Amazing!', timeout: 3000}))
      await this.sleep(3500)
      
      
      this.store.dispatch(guide.sendMessage({text: 'Now we are all set...', position: 'center'}))
      this.store.dispatch(guide.updateAvatar({name: 'mila', position: 'center'}))
      await this.sleep(3000)
      this.activityStatus = 'pre'
      this.runSit2Stand()
    }
    
    
    async playSit2Stand() {
      this.successfulAttempts = 0
      this.activityStatus = 'play'
      
      // For the messaging before the real game...
      await this.prePlaySit2Stand()
      
      await this.sleep(2000)
      // Do 5 reps: TODO get number of reps from the ca   replan
      let desiredClass: 'sit' | 'stand' | 'unknown' = 'unknown';
      let previousDesiredClass: 'sit' | 'stand' | 'unknown' = 'unknown';
      
      while (this.successfulAttempts < 10 && this.calibrationStatus == 'success') {
        
        this.taskId = v4()
        this.attemptId = v4()
        
        // sending the taskStarted event 
        this.analyticsService.sendTaskEvent({
          activity: this.activityId,
          attempt_id: this.attemptId,
          event_type: 'taskStarted',
          task_id: this.taskId,
          task_name: 'sit2stand',
        });
        
        console.log('successful attempt no:', this.successfulAttempts);
        previousDesiredClass = desiredClass;
        
        let num: number
        if (this.successfulAttempts === 0) {
          this.currentClass === 'stand'
          ? (num = Math.floor((Math.random() * 100) / 2) * 2)
          : (num = Math.floor((Math.random() * 100) / 2) * 2 + 1);
        } else {
          num = Math.floor(Math.random() * 100)
        }
        
        if (num % 2 === 0) {
          desiredClass = 'sit';
        } else {
          desiredClass = 'stand';
        }
        
        this.store.dispatch(guide.sendPrompt({ text: num.toString(), className: 'round', position: 'right' }))
        
        this.isWaitingForReaction = true
        
        // resolve has status property that can be used to send taskEnded events.
        const res = await this.waitForClassOrTimeOut(desiredClass, previousDesiredClass, 6000)
        
        this.isWaitingForReaction = false;
        
        // playing chord
        if (res.result === 'success') {
          this.soundService.playNextChord();
          this.successfulAttempts += 1
          
          this.analyticsService.sendTaskEvent({
            activity: this.activityId,
            attempt_id: this.attemptId,
            event_type: 'taskEnded',
            task_id: this.taskId,
            score: 1,
            task_name: desiredClass,
          });
        } else {
          // sending task ended with score 0 event.
          this.analyticsService.sendTaskEvent({
            activity: this.activityId,
            attempt_id: this.attemptId,
            event_type: 'taskEnded',
            task_id: this.taskId,
            score : 0,
            task_name: desiredClass,
          });
        }
      }
      
      console.log('reps completed')
      this.activityStatus = 'post'
      await this.postPlaySit2Stand();
      
    }
    
    
    async prePlaySit2Stand() {
      this.activityStatus = 'pre'
      this.store.dispatch(guide.sendMessage({text: 'STAND up when you are ready to start...', position: 'center'}))
      this.store.dispatch(guide.updateAvatar({name: 'mila'}))
      await this.waitForClass('stand')
      this.store.dispatch(guide.hideAvatar())
      this.store.dispatch(guide.hidePrompt())
      this.store.dispatch(guide.hideMessage())
      this.store.dispatch(guide.sendSpotlight({text: 'READY'}))
      await this.sleep(1000)
      this.store.dispatch(guide.sendSpotlight({text: 'GET-SET'}))
      await this.sleep(1000)
      this.store.dispatch(guide.sendSpotlight({text: 'GO'}))
      await this.sleep(1000)
      this.store.dispatch(guide.hideSpotlight())
      this.activityStatus = 'play'
    }
    
    async postPlaySit2Stand() {
      this.activityStatus = 'post'
      // activity ended
      this.analyticsService.sendActivityEvent({
        activity: this.activityId,
        event_type: 'activityEnded',
      });
      // assuming that the session ended event has to be sent here
      this.analyticsService.sendSessionEvent({
        event_type : 'sessionEnded'
      })
      
      this.analyticsService.sendSessionEndedAt()
      
      console.log('start postplay sit2stand')
      this.store.dispatch(guide.hidePrompt())
      this.store.dispatch(guide.updateAvatar({name: 'mila'}))
      this.store.dispatch(guide.sendMessage({ text: 'YOU WERE AMAZING!!!', position: 'center' }))
      // ending constantDrum here
      this.soundService.endConstantDrum()
      await this.sleep(3000)
      this.store.dispatch(guide.sendMessage({ text: 'Thank you for playing!', position: 'center' }))
      await this.sleep(3000)
      
      this.router.navigate(['/finished']);
    }
    
    async start(game: Phaser.Game, onComplete: Function) {
      
      this.analyticsService.sendSessionEvent({
        event_type :'sessionStarted'
      })
      
      this.game = game
      this.onComplete = onComplete
      this.subscribeToState()
      this.welcomeUser()
    }
    
    async runSit2Stand() {
      switch(this.activityStatus) {
        case 'pre':
          this.prePlaySit2Stand()
          break 
        case 'play':      
          this.playSit2Stand()
          break
        case 'post':
          this.postPlaySit2Stand()
          break
        case 'welcome':
        default:
          // move to the next stage...
          this.explainSit2Stand()
          
      }
    }
    
    subscribeToState(){
      this.observables$ = this.observables$ || {}
      // Subscribe to the pose
      
      this.previousPose = this.currentPose
      
      this.observables$.pose = this.store.select(state => state.pose);
      this.observables$.pose.subscribe((results: { pose: Results }) => {
        if(results) {
          this.handlePose(results);
          this.currentPose = results.pose
        }
      });
    }
    
    unsubscribe() {
      // TODO: unsubscribe from all the events
    }
    
    handlePose(results: { pose: Results }) {
      //   console.log('handlePose:results:', results)
      this.poseCount++
      const calibrationResult = this.calibrationService.handlePose(results)
      
      this.previousPose = results.pose;
      
      // Call appropriate hook when status changes
      if (calibrationResult && (this.calibrationStatus !== calibrationResult.status)) {
        this.handleCalibrationResult(this.calibrationStatus, calibrationResult.status)
        this.calibrationStatus = calibrationResult.status
        
        if (this.isWaitingForReaction) {
          const poseHash = this.sit2standPoseHashGenerator(results.pose, this.previousPose, calibrationResult.status)
          console.log(poseHash)
          if (poseHash === 1) {
            this.analyticsService.sendTaskEvent({
              activity: this.activityId,
              attempt_id: this.attemptId,
              event_type: 'taskReacted',
              task_id: this.taskId,
              task_name: this.currentClass,
            });
          }
        }
      }
      
      if (this.calibrationStatus == 'success' && this.sit2standService.isEnabled()) {
        const newClass = this.sit2standService.classify(results.pose).result
        this.handleClassChange(this.currentClass, newClass)
        this.currentClass = newClass
      }
    }
    
    
    sit2standPoseHashGenerator(pose : Results ,previuosPose: Results, status: string) {
      // initial calibration state.
      // do nothing.
      if (status === 'error') return -1
      
      
      // have to get previouspose for calculation
      // work out old distances
      const oldPoseLandmarkArray = previuosPose?.poseLandmarks!;
      const oldLeftHip = oldPoseLandmarkArray[23];
      const oldLeftKnee = oldPoseLandmarkArray[25];
      const oldRightHip = oldPoseLandmarkArray[24];
      const oldRightKnee = oldPoseLandmarkArray[26];
      
      const oldDistLeftHipKnee = SitToStandService.calcDist(oldLeftHip.x, oldLeftHip.y, oldLeftKnee.x, oldLeftKnee.y)
      const oldDistRightHipKnee = SitToStandService.calcDist(oldRightHip.x, oldRightHip.y, oldRightKnee.x, oldRightKnee.y)
      const oldDistAvg = (oldDistLeftHipKnee + oldDistRightHipKnee) / 2
      const newPostLandmarkArray = pose?.poseLandmarks!;
      const newLeftHip = newPostLandmarkArray[23];
      const newLeftKnee = newPostLandmarkArray[25];
      const newRightHip = newPostLandmarkArray[24];
      const newRightKnee = newPostLandmarkArray[26];
      
      const newDistLeftHipKnee = SitToStandService.calcDist(newLeftHip.x, newLeftHip.y, newLeftKnee.x, newLeftKnee.y)
      const newDistRightHipKnee = SitToStandService.calcDist(newRightHip.x, newRightHip.y, newRightKnee.x, newRightKnee.y)
      const newDistAvg = (newDistLeftHipKnee + newDistRightHipKnee) / 2
      
      console.log('oldDistAvg:', oldDistAvg)
      console.log('newDistAvg:', newDistAvg)
      console.log('oldDistance - newDistance =', oldDistAvg - newDistAvg)
      
      const result = Math.abs(oldDistAvg - newDistAvg)
      if (result > 0.1) {
        console.log('a reaction was detected')
        return 1
      }
      return 0
    }
    
    
    handleClassChange(oldClass: string, newClass: string) {
      // Do something?
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
    
    
    async waitForClassOrTimeOut(desiredClass: string, previousDesiredClass: string, timeout: number = 3000): Promise<{ result: 'success' | 'failure' }> {
      return new Promise((resolve) => {
        
        if (previousDesiredClass === desiredClass || this.currentClass === desiredClass) {
          setTimeout(() => {
            if (this.currentClass == desiredClass) {
              resolve({
                result :'success'
              });
            }
            resolve({
              result: 'failure'
            })
          }, timeout)
        } else {   
          const startTime = new Date().getTime();
          const interval = setInterval(() => {
            
            // checking if given timeout is completed
            if (new Date().getTime() - startTime > timeout) {
              // user didn't do correct thing but the time is out
              resolve({
                result: 'failure'
              })
              clearInterval(interval);
            }        
            if ((previousDesiredClass !== desiredClass) && (this.currentClass == desiredClass)) {
              resolve({
                result: 'success'
              });
              clearInterval(interval);
            }
          }, 300);
        }
      });
    }
    
    // handleClassChange(oldClass: string, newClass: string) {
    //   // Do something?
    // }
    
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

    async restartCalibration() {
      // Hide everything guide...and start all over again
      this.store.dispatch(guide.hideAvatar())
      this.store.dispatch(guide.hideMessage())
      this.store.dispatch(guide.hidePrompt())
      this.store.dispatch(guide.hideSpotlight())
      await this.sleep(200)

      this.store.dispatch(guide.updateAvatar({name: 'mila'}))
      this.store.dispatch(guide.sendMessage({text: 'I can no longer see your full body. ☹️', position: 'bottom'}))

      await this.sleep(2000)
      this.store.dispatch(guide.sendMessage({text: 'Please move back into the red box so that I can see you again.', position: 'bottom'}))
    }
    
    startSit2StandScene() {
      this.sit2standService.enable();
      this.soundService.startConstantDrum()
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
    
    handleCalibrationSuccess(oldStatus: string, newStatus: string) {
      this.calibrationScene.drawCalibrationBox('success')
      this.calibrationSuccessCount += 1
      console.log('successful calibration ', this.calibrationSuccessCount);
      
      this.startSit2StandScene()
      
      // this.soundService.startConstantDrum()
      
      
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
      if(oldStatus == 'warning' || oldStatus == 'success') {
        this.restartCalibration()
      }
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
        }, this.prod? timeout: 300)
      })
    }
  }
  