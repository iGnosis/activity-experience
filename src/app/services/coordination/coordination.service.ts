import { Injectable, Injector } from '@angular/core';
import { Store } from '@ngrx/store';
import { CalibrationScene } from 'src/app/scenes/calibration/calibration.scene';
import { announcement } from 'src/app/store/actions/announcement.actions';
import { guide } from 'src/app/store/actions/guide.actions';
import {
  ActivityStage,
  ActivityState,
  AnnouncementState,
  GuideState,
  Results,
  SessionState,
} from 'src/app/types/pointmotion';
import { CalibrationService } from '../calibration/calibration.service';
import { SitToStandService } from '../classifiers/sit-to-stand/sit-to-stand.service';
import { SoundsService } from '../sounds/sounds.service';
import { AnalyticsService } from '../analytics/analytics.service';
import { v4 } from 'uuid';
import { session } from 'src/app/store/actions/session.actions';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root',
})
export class CoordinationService {
  private game?: Phaser.Game;
  private onComplete: any;
  constructor(
    private store: Store<{
      session: SessionState;
      guide: GuideState;
      calibration: any;
      pose: any;
      announcement: AnnouncementState;
    }>,
    private injector: Injector,
    private calibrationService: CalibrationService,
    private calibrationScene: CalibrationScene,
    private soundService: SoundsService,
    private sit2standService: SitToStandService,
    private analyticsService: AnalyticsService,
  ) {
    this.store.dispatch(
      session.startActivity({
        totalReps: 10,
        repsCompleted: 0,
      }),
    );
  }

  calibrationSuccessCount = 0;
  calibrationStatus = 'error';

  observables$: any;

  currentClass: 'unknown' | 'disabled' | 'sit' | 'stand' = 'unknown';
  activityStage: ActivityStage = 'welcome';
  component?: any;

  index = -1;
  sequence: any = [];
  sit2StandExplained = false;

  activityId = '0fa7d873-fd22-4784-8095-780028ceb08e';
  attemptId = v4();
  taskId = v4();

  previousPose!: Results;
  isWaitingForReaction = false;

  successfulReps = 0;
  gameCompleted = false;
  isRecalibrated = false;

  async sendMessage(text: string, position: 'center' | 'bottom', skipWait = false) {
    return new Promise(async (resolve) => {
      const seconds = Math.ceil(text.split(' ').length / 2);
      this.store.dispatch(guide.sendMessage({ text, position }));
      if (!skipWait) {
        await this.sleep(environment.speedUpSession ? 300 : seconds * 1000);
      }
      resolve({});
    });
  }
  async welcomeUser() {
    this.activityStage = 'welcome';
    this.store.dispatch(guide.updateAvatar({ name: 'mila' }));
    await this.sendMessage('Hi!', 'center');

    await this.sleep(environment.speedUpSession ? 300 : 1000);

    await this.sendMessage(
      'My name is Mila. I am thrilled to be working with you today.',
      'center',
    );
    await this.sendMessage("I am here to guide you through today's session", 'center');
    await this.sendMessage('Before we start, we need to ensure a few things', 'bottom');
    await this.sendMessage('Firstly, we need to see you on the screen', 'bottom');
    await this.sendMessage(
      'Please move around such that you can see your whole body inside the red box',
      'bottom',
      true,
    );

    this.activityStage = 'explain';
    // Start with the red box and enable the calibration service
    this.calibrationScene.drawCalibrationBox('error');
    this.calibrationService.enable();
    // Result of calibration to be captured in the subscribeToState method
  }

  async explainSit2Stand() {
    this.activityStage = 'explain';

    this.store.dispatch(guide.hideAvatar());
    this.store.dispatch(guide.hideMessage());
    this.store.dispatch(announcement.announce({ message: 'Excellent', timeout: 3000 }));
    await this.sleep(environment.speedUpSession ? 300 : 3500);
    this.store.dispatch(guide.sendSpotlight({ text: 'Starting Next Activity' }));
    // activity started
    this.analyticsService.sendActivityEvent({
      activity: this.activityId,
      event_type: 'activityStarted',
    });

    await this.sleep(environment.speedUpSession ? 300 : 3500);
    this.store.dispatch(guide.sendSpotlight({ text: 'SIT TO STAND' }));
    await this.sleep(environment.speedUpSession ? 300 : 3500);
    this.store.dispatch(guide.hideSpotlight());
    await this.sleep(environment.speedUpSession ? 100 : 200);

    // Enable sit2stand service
    this.sit2standService.enable();
    await this.sleep(environment.speedUpSession ? 300 : 2000);
    this.store.dispatch(guide.updateAvatar({ name: 'mila' }));

    await this.sendMessage('Before we start the exercise, please sit down on a chair', 'center');

    await this.sendMessage(
      `Grab a chair if you don't have one and please sit down.`,
      'bottom',
      true,
    );

    await this.waitForClass('sit');
    this.store.dispatch(announcement.announce({ message: 'Perfect', timeout: 3000 }));
    await this.sleep(3500);

    await this.sendMessage('Now lets make this exercise interesting', 'center');

    await this.sendMessage('When you see an ODD number you STAND', 'center');

    await this.sendMessage('Let us try it out...', 'center');

    await this.sendMessage('Let us try it out...', 'bottom', true);

    this.store.dispatch(guide.sendPrompt({ className: 'round', text: '1', position: 'center' }));
    await this.sleep(environment.speedUpSession ? 300 : 3000);
    await this.waitForClass('stand');
    this.soundService.playNextChord();

    this.store.dispatch(announcement.announce({ message: 'Awesome!', timeout: 3000 }));
    await this.sleep(3500);

    this.store.dispatch(guide.updateAvatar({ name: 'mila', position: 'center' }));
    this.sendMessage('That was great!', 'center');
    this.sendMessage('Now when you see an EVEN number you can SIT', 'center');
    this.sendMessage('Let us give it a try?', 'center');
    this.sendMessage('Let us give it a try?', 'bottom', true);
    this.store.dispatch(guide.sendPrompt({ className: 'round', text: '12', position: 'center' }));
    this.sendMessage('SIT when you see an EVEN number', 'bottom', true);

    await this.waitForClass('sit');
    this.soundService.playNextChord();

    this.store.dispatch(guide.hideAvatar());
    this.store.dispatch(guide.hidePrompt());
    this.store.dispatch(guide.hideMessage());
    await this.sleep(100);
    this.store.dispatch(announcement.announce({ message: 'Amazing!', timeout: 3000 }));
    await this.sleep(3500);

    // this.store.dispatch(guide.sendMessage({ text: 'Now we are all set...', position: 'center' }));
    this.store.dispatch(guide.updateAvatar({ name: 'mila', position: 'center' }));
    this.sendMessage('Now we are all set...', 'center');
    await this.sleep(3000);
    this.sit2StandExplained = true;

    this.activityStage = 'preGame';
    this.runSit2Stand();
  }

  async playSit2Stand() {
    // For the messaging before the real game...
    if (this.activityStage === 'preGame' && this.calibrationStatus === 'success') {
      await this.prePlaySit2Stand();
    }
    await this.sleep(2000);

    if (this.activityStage === 'game' && this.calibrationStatus === 'success') {
      // Do 5 reps: TODO get number of reps from the careplan
      let desiredClass: 'sit' | 'stand' | 'unknown' = 'unknown';
      let previousDesiredClass: 'sit' | 'stand' | 'unknown' = 'unknown';

      if (this.isRecalibrated) {
        this.resumeSit2Stand();
      }

      while (
        this.successfulReps < 10 &&
        this.calibrationStatus === 'success' &&
        !this.isRecalibrated
      ) {
        12;
        this.taskId = v4();
        this.attemptId = v4();

        // sending the taskStarted event
        this.analyticsService.sendTaskEvent({
          activity: this.activityId,
          attempt_id: this.attemptId,
          event_type: 'taskStarted',
          task_id: this.taskId,
          task_name: 'sit2stand',
        });

        console.log('successful attempt no:', this.successfulReps);
        previousDesiredClass = desiredClass;

        let num: number;
        if (this.successfulReps === 0) {
          this.currentClass === 'stand'
            ? (num = Math.floor((Math.random() * 100) / 2) * 2)
            : (num = Math.floor((Math.random() * 100) / 2) * 2 + 1);
        } else {
          num = Math.floor(Math.random() * 100);
        }

        if (num % 2 === 0) {
          desiredClass = 'sit';
        } else {
          desiredClass = 'stand';
        }

        this.store.dispatch(
          guide.sendPrompt({
            text: num.toString(),
            className: 'round',
            position: 'right',
          }),
        );
        this.isWaitingForReaction = true;

        // resolve has status property that can be used to send taskEnded events.
        this.store.dispatch(guide.startTimer({ timeout: 6000 }));
        const res = await this.waitForClassOrTimeOut(desiredClass, previousDesiredClass, 6000);
        this.isWaitingForReaction = false;
        this.store.dispatch(guide.hideTimer());

        // playing chord
        if (res.result === 'success') {
          this.soundService.playNextChord();
          this.store.dispatch(session.addRep());
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
            score: 0,
            task_name: desiredClass,
          });
        }
      }

      console.log('reps completed');
      if (this.successfulReps >= 10) {
        this.gameCompleted = true;
        this.activityStage = 'postGame';
      }
    }

    if (this.activityStage === 'postGame' && this.calibrationStatus === 'success') {
      await this.postPlaySit2Stand();
    }
  }

  async prePlaySit2Stand() {
    this.activityStage = 'preGame';
    this.store.dispatch(
      guide.sendMessage({
        text: 'STAND up when you are ready to start...',
        position: 'center',
      }),
    );
    this.store.dispatch(guide.updateAvatar({ name: 'mila' }));
    await this.waitForClass('stand');
    this.store.dispatch(guide.hideAvatar());
    this.store.dispatch(guide.hidePrompt());
    this.store.dispatch(guide.hideMessage());
    this.store.dispatch(guide.sendSpotlight({ text: 'READY' }));
    await this.sleep(1000);
    this.store.dispatch(guide.sendSpotlight({ text: 'GET-SET' }));
    await this.sleep(1000);
    this.store.dispatch(guide.sendSpotlight({ text: 'GO' }));
    await this.sleep(1000);
    this.store.dispatch(guide.hideSpotlight());
    this.activityStage = 'game';
  }

  async resumeSit2Stand() {
    if (this.currentClass === 'sit') {
      this.store.dispatch(
        guide.sendMessage({
          text: 'STAND up when you are ready to start...',
          position: 'center',
        }),
      );
      this.store.dispatch(guide.updateAvatar({ name: 'mila' }));
      await this.waitForClass('stand');
    } else if (this.currentClass === 'stand') {
      this.store.dispatch(
        guide.sendMessage({
          text: 'SIT DOWN when you are ready to start...',
          position: 'center',
        }),
      );
      this.store.dispatch(guide.updateAvatar({ name: 'mila' }));
      await this.waitForClass('sit');
    }

    this.store.dispatch(guide.hideAvatar());
    this.store.dispatch(guide.hidePrompt());
    this.store.dispatch(guide.hideMessage());
    this.store.dispatch(guide.sendSpotlight({ text: 'READY' }));
    await this.sleep(1000);
    this.store.dispatch(guide.sendSpotlight({ text: 'GET-SET' }));
    await this.sleep(1000);
    this.store.dispatch(guide.sendSpotlight({ text: 'GO' }));
    await this.sleep(1000);
    this.store.dispatch(guide.hideSpotlight());
    this.isRecalibrated = false;
    this.playSit2Stand();
  }

  async postPlaySit2Stand() {
    // activity ended
    this.analyticsService.sendActivityEvent({
      activity: this.activityId,
      event_type: 'activityEnded',
    });
    // assuming that the session ended event has to be sent here
    this.analyticsService.sendSessionEvent({
      event_type: 'sessionEnded',
    });

    this.analyticsService.sendSessionEndedAt();

    console.log('start postplay sit2stand');
    this.store.dispatch(guide.hidePrompt());
    this.store.dispatch(guide.updateAvatar({ name: 'mila' }));
    // this.store.dispatch(guide.sendMessage({ text: 'YOU WERE AMAZING!!!', position: 'center' }));
    this.sendMessage('YOU WERE AMAZING!!!', 'center');
    // ending constantDrum here
    this.soundService.endConstantDrum();
    this.sleep(3000);
    this.store.dispatch(guide.sendMessage({ text: 'Thank you for playing!', position: 'center' }));
    this.sleep(5000);
  }

  async start(game: Phaser.Game, onComplete: any) {
    this.analyticsService.sendSessionEvent({
      event_type: 'sessionStarted',
    });

    this.game = game;
    this.onComplete = onComplete;
    this.subscribeToState();
    this.activityStage === 'welcome' && this.welcomeUser();
  }

  async runSit2Stand() {
    // this.sit2StandExplained = true
    if (!this.sit2StandExplained) {
      this.activityStage === 'explain' && this.explainSit2Stand();
      return;
    } else {
      // Run the sit2stand logic
      this.playSit2Stand();
      console.log('running sit2stand');
    }
  }

  subscribeToState() {
    this.observables$ = this.observables$ || {};
    // Subscribe to the pose

    this.observables$.pose = this.store.select((state) => state.pose);
    this.observables$.pose.subscribe((results: { pose: Results }) => {
      if (results) {
        this.handlePose(results);
      }
    });

    this.observables$.currentActivity = this.store.select((state) => state.session.currentActivity);
    this.observables$.currentActivity.subscribe((res: ActivityState) => {
      this.successfulReps = res.repsCompleted || 0;
    });
  }

  unsubscribe() {
    // TODO: unsubscribe from all the events
  }

  handlePose(results: { pose: Results }) {
    //   console.log('handlePose:results:', results)
    const calibrationResult = this.calibrationService.handlePose(results);

    this.previousPose = results.pose;

    // Call appropriate hook when status changes
    if (calibrationResult && this.calibrationStatus !== calibrationResult.status) {
      this.handleCalibrationResult(this.calibrationStatus, calibrationResult.status);
      this.calibrationStatus = calibrationResult.status;

      if (this.isWaitingForReaction) {
        const poseHash = this.sit2standPoseHashGenerator(results.pose, calibrationResult.status);
        console.log(poseHash);
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
      const newClass = this.sit2standService.classify(results.pose).result;
      this.handleClassChange(this.currentClass, newClass);
      this.currentClass = newClass;
    }
  }

  sit2standPoseHashGenerator(pose: Results, status: string) {
    // initial calibration state.
    // do nothing.
    if (status === 'error') return -1;

    // have to get previouspose for calculation
    // work out old distances
    const oldPoseLandmarkArray = pose?.poseLandmarks;
    const oldLeftHip = oldPoseLandmarkArray[23];
    const oldLeftKnee = oldPoseLandmarkArray[25];
    const oldRightHip = oldPoseLandmarkArray[24];
    const oldRightKnee = oldPoseLandmarkArray[26];

    const oldDistLeftHipKnee = SitToStandService.calcDist(
      oldLeftHip.x,
      oldLeftHip.y,
      oldLeftKnee.x,
      oldLeftKnee.y,
    );
    const oldDistRightHipKnee = SitToStandService.calcDist(
      oldRightHip.x,
      oldRightHip.y,
      oldRightKnee.x,
      oldRightKnee.y,
    );
    const oldDistAvg = (oldDistLeftHipKnee + oldDistRightHipKnee) / 2;

    const newPostLandmarkArray = pose?.poseLandmarks;
    const newLeftHip = newPostLandmarkArray[23];
    const newLeftKnee = newPostLandmarkArray[25];
    const newRightHip = newPostLandmarkArray[24];
    const newRightKnee = newPostLandmarkArray[26];

    const newDistLeftHipKnee = SitToStandService.calcDist(
      newLeftHip.x,
      newLeftHip.y,
      newLeftKnee.x,
      newLeftKnee.y,
    );
    const newDistRightHipKnee = SitToStandService.calcDist(
      newRightHip.x,
      newRightHip.y,
      newRightKnee.x,
      newRightKnee.y,
    );
    const newDistAvg = (newDistLeftHipKnee + newDistRightHipKnee) / 2;

    console.log('oldDistAvg:', oldDistAvg);
    console.log('newDistAvg:', newDistAvg);
    console.log('oldDistance - newDistance =', oldDistAvg - newDistAvg);

    const result = Math.abs(oldDistAvg - newDistAvg);
    if (result > 0.1) {
      console.log('a reaction was detected');
      return 1;
    }
    return 0;
  }

  handleClassChange(oldClass: string, newClass: string) {
    // Do something?
  }

  async waitForClass(className: 'sit' | 'stand') {
    return new Promise((resolve) => {
      if (this.currentClass == className) resolve({});
      // set interval
      const interval = setInterval(() => {
        if (this.currentClass == className) {
          resolve({});
          clearInterval(interval);
        }
      }, 300);
    });
  }

  async waitForClassOrTimeOut(
    desiredClass: string,
    previousDesiredClass: string,
    timeout = 3000,
  ): Promise<{ result: 'success' | 'failure' }> {
    return new Promise((resolve) => {
      if (previousDesiredClass === desiredClass || this.currentClass === desiredClass) {
        setTimeout(() => {
          if (this.currentClass == desiredClass) {
            resolve({
              result: 'success',
            });
          }
          resolve({
            result: 'failure',
          });
        }, timeout);
      } else {
        const startTime = new Date().getTime();
        const interval = setInterval(() => {
          // checking if given timeout is completed
          if (new Date().getTime() - startTime > timeout) {
            // user didn't do correct thing but the time is out
            resolve({
              result: 'failure',
            });
            clearInterval(interval);
          }
          if (previousDesiredClass !== desiredClass && this.currentClass == desiredClass) {
            resolve({
              result: 'success',
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
        this.handleCalibrationWarning(oldStatus, newStatus);

        break;
      case 'success':
        this.handleCalibrationSuccess(oldStatus, newStatus);
        break;
      case 'error':
      default:
        this.handleCalibrationError(oldStatus, newStatus);
        break;
    }
  }

  clearPrompts() {
    this.store.dispatch(guide.hide());
    this.store.dispatch(guide.hideAvatar());
    this.store.dispatch(guide.hidePrompt());
    this.store.dispatch(guide.hideMessage());
    this.store.dispatch(guide.hideSpotlight());
    this.store.dispatch(guide.hideTimer());
    this.store.dispatch(guide.hideVideo());
  }

  startSit2StandScene() {
    this.sit2standService.enable();
    this.soundService.startConstantDrum();
    if (this.game?.scene.isActive('calibration')) {
      this.game.scene.stop('calibration');
      console.log('calibration is active. turning off');
      this.game?.scene.start('sit2stand');
      console.log('start sit 2 stand');
    } else {
      console.log('sit2stand is already active');
    }

    // we are resuming the activity based on the activityStage
    if (
      this.activityStage === 'preGame' ||
      this.activityStage === 'game' ||
      this.activityStage === 'postGame'
    ) {
      this.clearPrompts();
      this.isRecalibrated = true;
      this.playSit2Stand();
    } else {
      this.runSit2Stand();
    }
  }

  handleCalibrationSuccess(oldStatus: string, newStatus: string) {
    this.calibrationScene.drawCalibrationBox('success');
    this.calibrationSuccessCount += 1;
    console.log('successful calibration ', this.calibrationSuccessCount);

    // this.soundService.startConstantDrum()
    this.startSit2StandScene();

    // if (this.calibrationSuccessCount == 1) {
    //   // First time success... Explain Sit2Stand

    // } else {
    //   // Second time success... Start from where we left off
    // }
  }

  handleCalibrationWarning(oldStatus: string, newStatus: string) {
    this.calibrationScene.drawCalibrationBox('warning');
    // TODO: If the earlier status was
  }

  handleCalibrationError(oldStatus: string, newStatus: string) {
    this.startCalibrationScene();
    this.calibrationScene.drawCalibrationBox('error');
    this.soundService.pauseConstantDrum();

    this.pauseActivity();
  }

  async pauseActivity() {
    this.clearPrompts();
    this.store.dispatch(guide.updateAvatar({ name: 'mila' }));

    this.store.dispatch(
      guide.sendMessage({
        text: "The game is now paused as we can't see you",
        position: 'center',
      }),
    );

    this.analyticsService.sendSessionState(this.activityStage);
  }

  async nextStep() {
    this.index += 1;
    if (this.sequence.length > this.index) {
      const action = this.sequence[this.index];
      switch (action.type) {
        case 'action':
          await this.handleAction(action);
          break;
        case 'timeout':
          await this.handleTimeout(action);
          break;
        case 'method':
          this.handleMethod(action);
          break;

        case 'service':
          this.handleService(action);
          break;

        case 'startNewSequence':
          // TODO: track where we left off in the older sequence?
          this.sequence = this[action.name as keyof typeof this];
          this.index = -1;
      }

      if (action.next != 'manual') {
        // if the next action can be executed automatically
        this.nextStep();
      }
    }
  }

  async runActivity() {}

  async handleAction(action: any) {
    if (action.action) {
      this.store.dispatch(action.action.call(this, action.data));
    }
  }

  async handleTimeout(action: any) {
    if (action.data) {
      await this.sleep(action.data);
    }
  }

  async handleMethod(action: any) {
    if (action.name == this.invokeComponentFunction) {
      if (action.sync) {
        await this.invokeComponentFunction(action.data.name, action.data.args); // TODO: support sending arguments
      } else {
        this.invokeComponentFunction(action.data.name, []);
      }
    } else if (action.name) {
      if (action.sync) await action.name();
      else action.name();
    }
  }

  async handleService(action: any) {
    const service = this.injector.get(action.name);
    service[action.method]();
  }

  async invokeComponentFunction(methodName: string, params: Array<any>) {
    if (this.component && typeof this.component[methodName] == 'function') {
      if (params) {
        await this.component[methodName](...params);
      } else {
        await this.component[methodName]();
      }
    }
  }
  async sleep(timeout: number) {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        resolve({});
      }, timeout);
    });
  }
}
