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
  SessionRow,
  SessionState,
} from 'src/app/types/pointmotion';
import { CalibrationService } from '../calibration/calibration.service';
import { SitToStandService } from '../classifiers/sit-to-stand/sit-to-stand.service';
import { SoundsService } from '../sounds/sounds.service';
import { AnalyticsService } from '../analytics/analytics.service';
import { v4 } from 'uuid';
import { session } from 'src/app/store/actions/session.actions';
import { environment } from 'src/environments/environment';
import { Observable } from 'rxjs';
import { DebugService } from '../analytics/debug/debug.service';
import { ActivatedRoute } from '@angular/router';

@Injectable({
  providedIn: 'root',
})
export class CoordinationService {
  private game?: Phaser.Game;
  private onComplete: any;

  private promptsArr: number[] = [];
  private currentPromptIdx = 0;
  private totalReps = 10;
  private repsArr: ('odd' | 'even')[] = [];

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
    private debugService: DebugService,
    private route: ActivatedRoute,
  ) {
    const prompts =
      this.route.snapshot.queryParamMap.get('prompts')?.split(',') ||
      this.route.snapshot.queryParamMap.get('prompt')?.split(',') ||
      undefined;
    if (prompts && prompts.length > 0) {
      this.totalReps = prompts.length;
      for (let i = 0; i < prompts.length; i++) {
        this.promptsArr.push(parseInt(prompts[i]));
      }
    }
    console.log(this.promptsArr);

    this.store.dispatch(
      session.startActivity({
        totalReps: 10,
        repsCompleted: 0,
      }),
    );
  }

  poseCount = 0;
  calibrationStatus = 'error';

  session: SessionRow;
  observables$: {
    activityId: Observable<string | undefined>;
    pose: Observable<any>;
    currentActivity: Observable<ActivityState | undefined>;
    session: Observable<SessionRow | undefined>;
  };

  currentClass: 'unknown' | 'disabled' | 'sit' | 'stand' = 'unknown';
  activityStage: ActivityStage = 'welcome';
  component?: any;

  index = -1;
  sequence: any = [];
  sit2StandExplained = false;

  activityId: string = this.analyticsService.getActivityId('Sit to Stand') as string;
  attemptId = v4();
  taskId = v4();
  desiredClass: 'sit' | 'stand' | 'unknown';
  previousDesiredClass: 'sit' | 'stand' | 'unknown';

  currentPose!: Results;
  previousPose!: Results;
  isWaitingForReaction = false;

  successfulReps = 0;
  activityCompleted = false;
  isRecalibrated = false;
  private welcomeStageComplete = false;

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
    this.soundService.playActivityInstructionSound();

    await this.step('welcome', 'sendSpotlight', { text: 'Starting Next Activity' });
    await this.step('welcome', 'sleep', environment.speedUpSession ? 300 : 3500);
    await this.step('welcome', 'sendSpotlight', { text: 'SIT TO STAND' });
    await this.step('welcome', 'sleep', environment.speedUpSession ? 300 : 3500);
    await this.step('welcome', 'hideSpotlight');
    await this.step('welcome', 'sleep', environment.speedUpSession ? 300 : 3500);

    await this.step('welcome', 'updateAvatar', { name: 'mila' });
    await this.step('welcome', 'sendMessage', { text: 'Hi!', position: 'center' });
    // await this.sendMessage('Hi!', 'center');

    await this.step('welcome', 'sleep', environment.speedUpSession ? 300 : 1000);
    await this.step('welcome', 'sendMessage', {
      text: 'My name is Mila. I am thrilled to be working with you today.',
      position: 'center',
    });

    await this.step('welcome', 'sendMessage', {
      text: "I am here to guide you through today's session.",
      position: 'center',
    });

    await this.step('welcome', 'sendMessage', {
      text: 'Before we start, we need to ensure a few things.',
      position: 'bottom',
    });
    await this.step('welcome', 'sendMessage', {
      text: 'Firstly, we need to see you on the screen.',
      position: 'bottom',
    });
    await this.step('welcome', 'sendMessage', {
      text: 'Please move around such that you can see your whole body inside the red box.',
      position: 'bottom',
      skipWait: true,
    });
    await this.step('welcome', 'sleep', environment.speedUpSession ? 300 : 2000);

    // this.activityStage = 'explain';
    // this.analyticsService.sendSessionState(this.activityStage);
    // Start with the red box and enable the calibration service
    this.calibrationScene.drawCalibrationBox('error');
    this.calibrationService.enable();

    this.welcomeStageComplete = true;
    // Result of calibration to be captured in the subscribeToState method
  }

  async waitForCalibration(className: 'success' | 'error' | 'warning') {
    return new Promise((resolve) => {
      if (this.calibrationStatus == className) resolve({});
      // set interval
      const interval = setInterval(() => {
        if (this.calibrationStatus == className) {
          resolve({});
          clearInterval(interval);
        }
      }, 300);
    });
  }

  async explainSit2Stand() {
    this.activityStage = 'explain';

    try {
      await this.step(this.activityStage, 'hideAvatar');
      await this.step(this.activityStage, 'hideMessage');
      await this.step(this.activityStage, 'announcement', { message: 'Excellent', timeout: 3000 });
      await this.step(this.activityStage, 'sleep', environment.speedUpSession ? 300 : 3500);

      // activity started
      console.log('event:activityStarted:sent');
      this.analyticsService.sendActivityEvent({
        activity: this.activityId,
        event_type: 'activityStarted',
      });

      // await this.step(this.activityStage, 'sleep', environment.speedUpSession ? 100 : 200);

      // Enable sit2stand service
      this.sit2standService.enable();
      // await this.step(this.activityStage, 'sleep', environment.speedUpSession ? 300 : 2000);
      await this.step(this.activityStage, 'updateAvatar', { name: 'mila' });

      await this.step(this.activityStage, 'sendMessage', {
        text: 'Before we start the exercise, please sit down on a chair',
        position: 'center',
      });

      await this.step(this.activityStage, 'sendMessage', {
        text: `Grab a chair if you don't have one and please sit down.`,
        position: 'bottom',
        skipWait: true,
      });
      await this.step(this.activityStage, 'sleep', 500);

      await this.step(this.activityStage, 'waitForClass', 'sit');

      await this.step(this.activityStage, 'announcement', { message: 'Perfect', timeout: 3000 });
      this.soundService.playActivitySound('success');
      await this.step(this.activityStage, 'sleep', 3500);

      await this.step(this.activityStage, 'sendMessage', {
        text: 'Now lets make this exercise interesting',
        position: 'center',
      });
      await this.step(this.activityStage, 'sendMessage', {
        text: 'When you see an ODD number you STAND',
        position: 'center',
      });
      await this.step(this.activityStage, 'sendMessage', {
        text: 'Let us try it out...',
        position: 'center',
      });
      await this.step(this.activityStage, 'sendMessage', {
        text: 'Let us try it out...',
        position: 'bottom',
        skipWait: true,
      });

      await this.step(this.activityStage, 'sendPrompt', {
        className: 'round',
        text: '1',
        position: 'center',
      });
      await this.step(this.activityStage, 'sleep', environment.speedUpSession ? 300 : 3000);
      await this.step(this.activityStage, 'waitForClass', 'stand');
      this.soundService.playActivitySound('success');

      await this.step(this.activityStage, 'hidePrompt');
      await this.step(this.activityStage, 'announcement', { message: 'Awesome!', timeout: 3000 });

      await this.step(this.activityStage, 'sleep', 3500);

      await this.step(this.activityStage, 'updateAvatar', { name: 'mila', position: 'center' });
      await this.step(this.activityStage, 'sendMessage', {
        text: 'That was great!',
        position: 'center',
      });
      await this.step(this.activityStage, 'sendMessage', {
        text: 'Now when you see an EVEN number you can SIT',
        position: 'center',
      });
      await this.step(this.activityStage, 'sendMessage', {
        text: 'Let us give it a try?',
        position: 'center',
      });
      await this.step(this.activityStage, 'sendMessage', {
        text: 'Let us give it a try?',
        position: 'bottom',
        skipWait: true,
      });

      await this.step(this.activityStage, 'sendPrompt', {
        className: 'round',
        text: '12',
        position: 'center',
      });

      await this.step(this.activityStage, 'waitForClass', 'sit');
      this.soundService.playActivitySound('success');

      await this.step(this.activityStage, 'hideAvatar');
      await this.step(this.activityStage, 'hidePrompt');
      await this.step(this.activityStage, 'hideMessage');
      await this.step(this.activityStage, 'sleep', 100);
      await this.step(this.activityStage, 'announcement', { message: 'Amazing!', timeout: 3000 });
      await this.step(this.activityStage, 'sleep', 3500);

      // this.store.dispatch(guide.sendMessage({ text: 'Now we are all set...', position: 'center' }));
      await this.step(this.activityStage, 'updateAvatar', { name: 'mila', position: 'center' });
      await this.step(this.activityStage, 'sendMessage', {
        text: 'Now we are all set...',
        position: 'center',
      });
      await this.step(this.activityStage, 'sleep', 3000);

      this.sit2StandExplained = true;
      this.soundService.pauseActivityInstructionSound();

      this.activityStage = 'preGame';
      this.analyticsService.sendSessionState(this.activityStage);

      this.runSit2Stand();
    } catch (err) {
      return;
    }
  }

  async playSit2Stand(stage?: ActivityStage) {
    // For the messaging before the real game...
    if (stage) {
      this.activityStage = stage;
    }
    if (this.activityStage === 'preGame' && this.calibrationStatus !== 'error') {
      await this.prePlaySit2Stand();
    }

    try {
      // await this.waitForCalibration('success');
      console.log('activity stage, calibstatus:', this.activityStage, this.calibrationStatus);
      if (this.activityStage === 'game') {
        // Do 5 reps: TODO get number of reps from the careplan
        this.desiredClass = 'unknown';
        this.previousDesiredClass = 'unknown';

        if (this.isRecalibrated) {
          this.resumeSit2Stand();
        }

        while (
          this.successfulReps < this.totalReps &&
          this.calibrationStatus !== 'error' &&
          !this.isRecalibrated
        ) {
          this.taskId = v4();
          this.attemptId = v4();

          this.previousDesiredClass = this.desiredClass;

          let num: number;
          if (this.successfulReps === 0) {
            if (this.promptsArr.length > 0) {
              num = this.promptsArr[this.currentPromptIdx];
            } else {
              this.currentClass === 'stand'
                ? (num = Math.floor((Math.random() * 100) / 2) * 2)
                : (num = Math.floor((Math.random() * 100) / 2) * 2 + 1);
            }
          } else {
            if (this.promptsArr.length >= 1) {
              num = this.promptsArr[this.currentPromptIdx];
            } else {
              if (this.repsArr.length >= 2) {
                if (
                  this.repsArr[this.currentPromptIdx - 1] === 'even' &&
                  this.repsArr[this.currentPromptIdx - 2] === 'even'
                ) {
                  num = Math.floor((Math.random() * 100) / 2) * 2 + 1;
                } else if (
                  this.repsArr[this.currentPromptIdx - 1] === 'odd' &&
                  this.repsArr[this.currentPromptIdx - 2] === 'odd'
                ) {
                  num = Math.floor((Math.random() * 100) / 2) * 2;
                } else {
                  num = Math.floor(Math.random() * 100);
                }
              } else {
                num = Math.floor(Math.random() * 100);
              }
            }
          }

          console.log('repsArr', this.repsArr);

          if (num % 2 === 0) {
            this.desiredClass = 'sit';
            this.repsArr.push('even');
          } else {
            this.desiredClass = 'stand';
            this.repsArr.push('odd');
          }

          // sending the taskStarted event
          console.log('event:taskStarted:sent');
          this.analyticsService.sendTaskEvent({
            activity: this.activityId,
            attempt_id: this.attemptId,
            event_type: 'taskStarted',
            task_id: this.taskId,
            task_name: this.desiredClass,
          });

          await this.step('game', 'sendPrompt', {
            text: num.toString(),
            className: 'round',
            position: 'right',
          });
          this.isWaitingForReaction = true;

          // resolve has status property that can be used to send taskEnded events.
          await this.step('game', 'startTimer', { timeout: 6000 });
          const res = await this.waitForClassOrTimeOut(
            this.desiredClass,
            this.previousDesiredClass,
            6000,
          );
          this.isWaitingForReaction = false;
          await this.step('game', 'hideTimer');

          // playing chord
          if (res.result === 'success') {
            this.currentPromptIdx += 1;
            this.soundService.playNextChord();
            this.store.dispatch(session.addRep());
            console.log('event:taskEnded:sent:score', 1);
            this.analyticsService.sendTaskEvent({
              activity: this.activityId,
              attempt_id: this.attemptId,
              event_type: 'taskEnded',
              task_id: this.taskId,
              score: 1,
              task_name: this.desiredClass,
            });
          } else {
            this.currentPromptIdx += 1;
            console.log('event:taskEnded:sent:score', 0);
            this.analyticsService.sendTaskEvent({
              activity: this.activityId,
              attempt_id: this.attemptId,
              event_type: 'taskEnded',
              task_id: this.taskId,
              score: 0,
              task_name: this.desiredClass,
            });
          }
        }

        if (this.successfulReps >= this.totalReps) {
          this.activityStage = 'postGame';
          this.analyticsService.sendSessionState(this.activityStage);
        }
      }
    } catch (err) {
      return;
    }

    if (this.activityStage === 'postGame' && this.calibrationStatus !== 'error') {
      await this.postPlaySit2Stand();
    }
  }

  async prePlaySit2Stand() {
    try {
      this.activityStage = 'preGame';
      if (!this.soundService.isConstantDrumPlaying()) {
        this.soundService.startConstantDrum();
      }
      await this.step(this.activityStage, 'updateAvatar', { name: 'mila', position: 'center' });
      await this.step(this.activityStage, 'sendMessage', {
        text: 'STAND up when you are ready to start...',
        position: 'center',
      });
      await this.step(this.activityStage, 'waitForClass', 'stand');
      await this.step(this.activityStage, 'hideAvatar');
      await this.step(this.activityStage, 'hidePrompt');
      await this.step(this.activityStage, 'hideMessage');
      await this.step(this.activityStage, 'sendSpotlight', { text: 'READY' });
      await this.step(this.activityStage, 'sleep', 1000);
      await this.step(this.activityStage, 'sendSpotlight', { text: 'GET-SET' });
      await this.step(this.activityStage, 'sleep', 1000);
      await this.step(this.activityStage, 'sendSpotlight', { text: 'GO' });
      await this.step(this.activityStage, 'sleep', 1000);
      await this.step(this.activityStage, 'hideSpotlight');
      this.activityStage = 'game';
      this.analyticsService.sendSessionState(this.activityStage);
    } catch (err) {
      return;
    }
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
    console.log('event:activityEnded:sent');
    this.analyticsService.sendActivityEvent({
      activity: this.activityId,
      event_type: 'activityEnded',
    });

    console.log('event:sessionEnded:sent');
    this.analyticsService.sendSessionEvent({
      event_type: 'sessionEnded',
    });
    this.debugService.inspectStack();

    this.analyticsService.sendSessionEndedAt();
    this.activityCompleted = true;
    this.calibrationService.disable();

    await this.step('postGame', 'hidePrompt');
    await this.step('postGame', 'updateAvatar', { name: 'mila' });
    // this.store.dispatch(guide.sendMessage({ text: 'YOU WERE AMAZING!!!', position: 'center' }));
    await this.step('postGame', 'sendMessage', { text: 'YOU WERE AMAZING!!!', position: 'center' });
    // ending constantDrum here
    // this.soundService.endConstantDrum();
    await this.step('postGame', 'sleep', 3000);
    await this.step('postGame', 'sendMessage', {
      text: 'Thank you for playing!',
      position: 'center',
    });

    this.soundService.pauseConstantDrum();
    this.store.dispatch(session.setSessionEnded());
    this.soundService.playRewardSound();
    await this.step('postGame', 'sleep', 5000);
  }

  async start(game: Phaser.Game, onComplete: any) {
    console.log('event:sessionStarted:sent');
    this.analyticsService.sendSessionEvent({
      event_type: 'sessionStarted',
    });

    this.game = game;
    this.onComplete = onComplete;
    this.subscribeToState();

    this.welcomeUser();
  }

  async runSit2Stand() {
    // this.sit2StandExplained = true
    if (!this.sit2StandExplained) {
      this.activityStage === 'explain' && this.explainSit2Stand();
    } else {
      // Run the sit2stand logic
      this.playSit2Stand();
      console.log('running sit2stand');
    }
  }

  async step(
    step: ActivityStage,
    type:
      | 'updateAvatar'
      | 'sendMessage'
      | 'sleep'
      | 'hideAvatar'
      | 'hideMessage'
      | 'announcement'
      | 'sendSpotlight'
      | 'hideSpotlight'
      | 'waitForClass'
      | 'sendPrompt'
      | 'hidePrompt'
      | 'startTimer'
      | 'hideTimer',
    data?: any,
    stepNumber?: number,
  ) {
    return new Promise(async (resolve, reject) => {
      // check if the user is calibrated or not
      if (step === 'explain' && this.calibrationStatus === 'error') {
        this.soundService.pauseActivityInstructionSound();
        reject({});
        return;
      } else if (step === 'preGame' && this.calibrationStatus === 'error') {
        reject({});
        return;
      }
      // else if (step === 'game' && this.calibrationStatus === 'error') {
      //   reject({});
      //   return;
      // }

      switch (type) {
        case 'updateAvatar':
          this.store.dispatch(guide.updateAvatar(data));
          resolve({});
          return;
        case 'sendMessage':
          if (data.skipWait) {
            await this.sendMessage(data.text, data.position, data.skipWait);
            resolve({});
          } else {
            await this.sendMessage(data.text, data.position);
            resolve({});
          }
          return;
        case 'sleep':
          await this.sleep(data);
          resolve({});
          return;
        case 'announcement':
          this.store.dispatch(announcement.announce(data));
          resolve({});
          return;
        case 'sendSpotlight':
          this.store.dispatch(guide.sendSpotlight(data));
          resolve({});
          return;
        case 'waitForClass':
          await this.waitForClass(data);
          resolve({});
          return;
        case 'sendPrompt':
          this.store.dispatch(guide.sendPrompt(data));
          resolve({});
          return;
        case 'startTimer':
          this.store.dispatch(guide.startTimer(data));
          resolve({});
          return;
        case 'hidePrompt':
          this.store.dispatch(guide.hidePrompt());
          resolve({});
          return;
        case 'hideAvatar':
          this.store.dispatch(guide.hideAvatar());
          resolve({});
          return;
        case 'hideMessage':
          this.store.dispatch(guide.hideMessage());
          resolve({});
          return;
        case 'hideSpotlight':
          this.store.dispatch(guide.hideSpotlight());
          resolve({});
          return;
        case 'hideTimer':
          this.store.dispatch(guide.hideTimer());
          resolve({});
          return;
      }
    });
  }

  subscribeToState() {
    this.observables$ = this.observables$ || {};
    // Subscribe to the pose

    this.observables$.pose = this.store.select((state) => state.pose);
    this.observables$.pose.subscribe((results: { pose: Results }) => {
      this.previousPose = this.currentPose;
      if (results) {
        this.handlePose(results);
      }
    });

    this.observables$.currentActivity = this.store.select((state) => state.session.currentActivity);
    this.observables$.currentActivity.subscribe((res: ActivityState | undefined) => {
      this.successfulReps = res?.repsCompleted || 0;
    });

    this.observables$.session = this.store.select((state) => state.session.session);
    this.session = this.getValue(this.observables$.session);
    if (
      this.session &&
      this.session.state &&
      this.session.state.stage &&
      this.session.state.stage !== 'postGame'
    ) {
      this.activityStage = this.session.state.stage;
    } else {
      // if the stage doesn't exist i.e. it's a new session! so we start from explain stage.
      this.activityStage = 'explain';
    }
    console.log(this.activityStage);
  }

  getValue(obj: Observable<any>) {
    let value: any;
    obj.subscribe((v) => (value = v));
    return value;
  }

  unsubscribe() {
    // TODO: unsubscribe from all the events
  }

  handlePose(results: { pose: Results }) {
    this.currentPose = results.pose;
    this.poseCount++;
    //   console.log('handlePose:results:', results)
    const calibrationResult = this.calibrationService.handlePose(results);
    // Call appropriate hook when status changes
    if (calibrationResult && this.calibrationStatus !== calibrationResult.status) {
      this.handleCalibrationResult(this.calibrationStatus, calibrationResult.status);
      this.calibrationStatus = calibrationResult.status;
    }

    if (this.isWaitingForReaction) {
      const poseHash = this.sit2standPoseHashGenerator(
        this.previousPose,
        results.pose,
        calibrationResult!.status,
      );
      // console.log('poseHash:', poseHash);
      if (poseHash === 1) {
        console.log('event:taskReacted:sent');
        this.analyticsService.sendTaskEvent({
          activity: this.activityId,
          attempt_id: this.attemptId,
          event_type: 'taskReacted',
          task_id: this.taskId,
          task_name: this.desiredClass,
        });
      }
    }

    if (this.calibrationStatus !== 'error' && this.sit2standService.isEnabled()) {
      const newClass = this.sit2standService.classify(results.pose).result;
      this.handleClassChange(this.currentClass, newClass);
      this.currentClass = newClass;
    }
  }

  sit2standPoseHashGenerator(oldPose: Results, newPose: Results, status: string) {
    // initial calibration state.
    // do nothing.
    if (status === 'error') return -1;

    // have to get previouspose for calculation
    // work out old distances
    const oldPoseLandmarkArray = oldPose?.poseLandmarks;
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

    const newPostLandmarkArray = newPose?.poseLandmarks;
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

    const result = Math.abs(oldDistAvg - newDistAvg);
    if (result > 0.1) {
      console.log('a reaction was detected');
      console.log('oldDistAvg:', oldDistAvg);
      console.log('newDistAvg:', newDistAvg);
      console.log('oldDistance - newDistance =', oldDistAvg - newDistAvg);
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

  async startCalibrationScene() {
    this.sit2standService.disable();
    if (this.game?.scene.isActive('sit2stand')) {
      this.game.scene.stop('sit2stand');
      console.log('sit2stand is active. turning off');
      this.game?.scene.start('calibration');
      console.log('start calibration');
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

  async startSit2StandScene() {
    this.sit2standService.enable();
    // this.soundService.startConstantDrum();

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
      this.activityStage === 'postGame' ||
      this.activityStage === 'explain'
    ) {
      this.clearPrompts();
      if (
        this.activityStage === 'preGame' ||
        this.activityStage === 'game' ||
        this.activityStage === 'postGame'
      ) {
        if (!this.soundService.isConstantDrumPlaying()) {
          this.soundService.startConstantDrum();
        }
        this.isRecalibrated = true;
        this.playSit2Stand(this.activityStage);
      } else if (this.activityStage === 'explain') {
        this.soundService.resumeActivityInstructionSound();
        this.runSit2Stand();
      }
    }
  }

  handleCalibrationSuccess(oldStatus: string, newStatus: string) {
    this.calibrationScene.drawCalibrationBox('success');
    this.soundService.playCalibrationSound('success');
    this.startSit2StandScene();
  }

  handleCalibrationWarning(oldStatus: string, newStatus: string) {
    this.calibrationScene.drawCalibrationBox('warning');
  }

  handleCalibrationError(oldStatus: string, newStatus: string) {
    this.startCalibrationScene();
    this.soundService.playCalibrationSound('error');
    this.calibrationScene.drawCalibrationBox('error');
    this.pauseActivity();
  }

  async pauseActivity() {
    if (
      this.activityStage === 'preGame' ||
      this.activityStage === 'game' ||
      this.activityStage === 'postGame'
    ) {
      this.soundService.pauseConstantDrum();
    }

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
