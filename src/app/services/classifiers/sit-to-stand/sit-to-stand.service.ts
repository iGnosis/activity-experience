import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import { guide } from 'src/app/store/actions/guide.actions';
import { spotlight } from 'src/app/store/actions/spotlight.actions';
import { Results } from 'src/app/types/pointmotion';
import { AnalyticsService } from '../../analytics/analytics.service';
import { CareplanService } from '../../careplan/careplan.service';
import { SoundsService } from '../../sounds/sounds.service';
import { v4 } from 'uuid';
import { environment } from 'src/environments/environment';
import { CalibrationScene } from 'src/app/scenes/calibration/calibration.scene';
@Injectable({
  providedIn: 'root',
})
export class SitToStandService {
  private isWaitingForReaction = false;
  private isEnabled = false;
  private distanceThreshold = 0.25;
  private currentClass = 'unknown';
  private repsCompleted = 0;
  private totalTasks = 0;
  private activityExplained = false;
  private task = {
    text: 'ONE',
    title: '1',
    timeout: 5000,
    className: 'stand',
    celebrated: false,
  };

  activityId: string;
  taskId = v4();
  attemptId = v4();

  tasks = [
    {
      text: 'TWENTY',
      title: '20',
      className: 'sit',
      timeout: 5000,
      celebrated: false,
    },
    {
      text: 'ELEVEN',
      title: '11',
      className: 'stand',
      timeout: 5000,
      celebrated: false,
    },
    {
      text: 'EIGHT',
      title: '8',
      className: 'sit',
      timeout: 5000,
      celebrated: false,
    },
    {
      text: 'FOURTEEN',
      title: '14',
      className: 'sit',
      timeout: 5000,
      celebrated: false,
    },
    {
      text: 'EIGHT',
      title: '8',
      className: 'sit',
      timeout: 5000,
      celebrated: false,
    },
    {
      text: 'THREE',
      title: '3',
      className: 'stand',
      timeout: 5000,
      celebrated: false,
    },
    {
      text: 'TWENTY',
      title: '20',
      className: 'sit',
      timeout: 5000,
      celebrated: false,
    },
    {
      text: 'FIFTY ONE',
      title: '51',
      className: 'stand',
      timeout: 5000,
      celebrated: false,
    },
  ];

  public static calcDist(x1: number, y1: number, x2: number, y2: number): any {
    // distance = √[(x2 – x1)^2 + (y2 – y1)^2]
    const distance = Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
    return distance;
  }

  constructor(
    private careplan: CareplanService,
    private store: Store<{ calibration: any; spotlight: any }>,
    private analyticsService: AnalyticsService,
    private soundService: SoundsService,
    private calibrationScene: CalibrationScene
  ) {
    this.activityId = this.analyticsService.getActivityId('Sit to Stand');

    console.log('starting activity')
    this.analyticsService.sendActivityEvent({
      activity: this.activityId,
      event_type: 'activityStarted',
    });

    // Try pulling in the distance threshold from the careplan config. Fallback to 0.25
    try {
      this.distanceThreshold = this.careplan.getCarePlan().config['sit2stand'].pointDistanceThreshold;
    } catch (err) {
      console.error(err);
      this.distanceThreshold = 0.25;
    }

    // Listen to the poses... From calibration service
    this.store
      .select((state) => state.calibration)
      .subscribe((data: any) => {
        if (data && data.pose) {
          this.classify(data.pose);
        }
      });

    this.store
      .select((state) => state.calibration.status)
      .subscribe((status: string) => {
        if (status == 'success') {
          this.action_enable();
          this.reStartActivity();
          if (!this.soundService.isConstantDrumPlaying()) {
            this.soundService.startContantDrum();
          }
        } else if (status == 'error' && this.activityExplained) {
          this.action_disable();
          if (this.soundService.isConstantDrumPlaying()) {
            this.soundService.pauseContantDrum();
          }
          this.calibrationScene.scene.start('calibration');
          // if the calibration is error
          // debouncing the pauseActivity() for 3 seconds
          //   this.debounce(this.pauseActivity(), 3000);
        }
      });

    this.store
      .select((state) => state.calibration.poseHash)
      .subscribe((poseHash: number) => {
        console.log('poseHash:', poseHash)
        console.log('isWaitingForReaction:', this.isWaitingForReaction)
        if (this.isWaitingForReaction && poseHash == 1) {
          // send reaction event for current running task
          console.log('sending reaction event.')
          this.sendTaskReactedEvent()
          this.isWaitingForReaction = false
        }
      })
  }

  debounce(func: any, timeout = 300) {
    let timer: any;
    return (...args: any[]) => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        func.apply(this, args);
      }, timeout);
    };
  }

  classify(pose: Results) {
    // this.analyticsService.sendTaskEvent({
    //   activity: this.activityId,
    //   attempt_id: this.attemptId,
    //   event_type: 'taskReacted',
    //   task_id: this.taskId,
    //   task_name: 'sit2stand',
    // });
    if (this.isEnabled) {
      const postLandmarkArray = pose.poseLandmarks;

      const leftShoulder = postLandmarkArray[11];
      const leftHip = postLandmarkArray[23];
      const leftKnee = postLandmarkArray[25];
      const rightShoulder = postLandmarkArray[12];
      const rightHip = postLandmarkArray[24];
      const rightKnee = postLandmarkArray[26];

      // make sure that body parts are visible
      if (
        (leftShoulder.visibility && leftShoulder.visibility < 0.6) ||
        (leftHip.visibility && leftHip.visibility < 0.6) ||
        (leftKnee.visibility && leftKnee.visibility < 0.6) ||
        (rightShoulder.visibility && rightShoulder.visibility < 0.6) ||
        (rightHip.visibility && rightHip.visibility < 0.6) ||
        (rightKnee.visibility && rightKnee.visibility < 0.6)
      ) {
        return {
          result: 'unknown',
        };
      }

      const distanceBetweenLeftShoulderAndHip = SitToStandService.calcDist(
        leftShoulder.x,
        leftShoulder.y,
        leftHip.x,
        leftHip.y
      );
      const distanceBetweenRightShoulderAndHip = SitToStandService.calcDist(
        rightShoulder.x,
        rightShoulder.y,
        rightHip.x,
        rightHip.y
      );
      const distanceBetweenLeftHipAndKnee = SitToStandService.calcDist(
        leftHip.x,
        leftHip.y,
        leftKnee.x,
        leftKnee.y
      );
      const distanceBetweenRightHipAndKnee = SitToStandService.calcDist(
        rightHip.x,
        rightHip.y,
        rightKnee.x,
        rightKnee.y
      );

      // console.log(`dist - L: s-h: ${distanceBetweenLeftShoulderAndHip} h-k: ${distanceBetweenLeftHipAndKnee}`)
      // console.log(`dist - R: s-h: ${distanceBetweenRightShoulderAndHip} h-k: ${distanceBetweenRightHipAndKnee}`)

      const isSittingL =
        distanceBetweenLeftShoulderAndHip > 1.5 * distanceBetweenLeftHipAndKnee;
      const isSittingR =
        distanceBetweenRightShoulderAndHip > 1.5 * distanceBetweenRightHipAndKnee;

      if (isSittingL && isSittingR) {
        console.log('sitting down');
        // this.store.dispatch(guide.sendMessages({title: 'Sitting down', text: 'Sitting', timeout: 2000}))
        if (this.currentClass !== 'sit') {
          // the class has changed... use it for evaluation
          this.currentClass = 'sit';
          if (this.task.className == 'sit') {
            // this.store.dispatch(guide.hide())
            // this.store.dispatch(guide.sendMessages({text: 'Perfect', title: 'Correct', timeout: 2000}))
            this.celebrate();
            this.sendTaskEndedEvent(1);
            this.playSuccessTune();
          }
        }
        return {
          result: 'sit',
        };
      } else {
        // this.store.dispatch(guide.sendMessages({title: 'Standing', text: 'Standing', timeout: 2000}))
        if (this.currentClass !== 'stand') {
          // the class has changed... use it for evaluation
          this.currentClass = 'stand';
          if (this.task.className == 'stand') {
            // this.store.dispatch(guide.hide())
            // this.store.dispatch(guide.sendMessages({text: 'Perfect', title: 'Correct', timeout: 2000}))
            this.celebrate();
            this.sendTaskEndedEvent(1);
            this.playSuccessTune();
          }
        }
        return {
          result: 'stand',
        };
      }
    } else {
      //   this.sendTaskEndedEvent(0);
      return {
        result: 'disabled',
      };
    }
  }

  playSuccessTune() {
    environment.musicExperience === 'music_experience_2' &&
      this.soundService.playNextChord();
  }

  celebrate() {
    this.repsCompleted += 1;
    this.task.celebrated = true;
    this.store.dispatch(spotlight.celebrate());
  }

  async reStartActivity() {
    if (!this.activityExplained) {
      // Music starts playing here
      !this.soundService.isConstantDrumPlaying() &&
        this.soundService.startContantDrum();

      this.store.dispatch(
        guide.sendMessages({
          text: 'Please SIT when you see an EVEN number and STAND when you see ODD number',
          title: 'Ready?',
          timeout: 1000,
        })
      );

      this.activityExplained = true;

      setTimeout(() => {
        this.runActivity();
      }, 1000);
    } else {
      // activity is already explained... run the activity
      this.runActivity();
    }
  }

  async pauseActivity() {
    this.action_disable();
    this.store.dispatch(
      guide.sendMessages({
        text: 'Activity pause',
        title: 'pause',
        timeout: 3000,
      })
    );
  }

  async runActivity() {
    /*     !this.soundService.isConstantDrumPlaying() &&
      this.soundService.startContantDrum(); */

    // end of activity
    if (this.repsCompleted >= 10) {
      this.analyticsService.sendActivityEvent({
        activity: this.activityId,
        event_type: 'activityEnded',
      });

      this.store.dispatch(
        guide.sendMessages({ text: 'DONE', title: 'Thank you!', timeout: 5000 })
      );
      this.soundService.endConstantDrum();

      const failedTasks = this.totalTasks - this.repsCompleted;
      // store failed events

      this.isEnabled = false;
      // setting sessionEnded to true
      return;
    }

    console.log('starting a task')
    this.isWaitingForReaction = true

    this.analyticsService.sendTaskEvent({
      activity: this.activityId,
      attempt_id: this.attemptId,
      event_type: 'taskStarted',
      task_id: this.taskId,
      task_name: 'sit2stand', // TODO: Replace all 'sit2stand' with their task names ('sit' or 'stand')
    });

    // set the task in a class variable and watch the class from the store.
    this.isEnabled &&
      this.store.dispatch(
        guide.sendMessages({
          text: this.task.text,
          title: this.task.title,
          timeout: this.task.timeout,
        })
      );

    this.isEnabled &&
      setTimeout(() => {
        // Check if the person held the right pose, but we did not celebrate...
        if (this.currentClass == this.task.className && !this.task.celebrated) {
          this.celebrate();
          this.sendTaskEndedEvent(1);
          this.playSuccessTune();
        }

        this.getNewTask();
        this.runActivity();
      }, this.task.timeout);
  }

  getNewTask() {
    this.attemptId = v4();
    this.taskId = v4();
    this.task = this.tasks[this.totalTasks % (this.tasks.length - 1)];
    this.totalTasks += 1;
  }

  action_enable() {
    this.isEnabled = true;
  }

  action_disable() {
    this.isEnabled = false;
  }

  sendTaskReactedEvent() {
    this.analyticsService.sendTaskEvent({
      activity: this.activityId,
      attempt_id: this.attemptId,
      event_type: 'taskReacted',
      task_id: this.taskId,
      task_name: 'sit2stand', // this.task.className. TODO: task_name can either be 'sit' or 'stand'.
    });
  }

  sendTaskEndedEvent(score: number) {
    console.log('ending a task')
    this.analyticsService.sendTaskEvent({
      activity: this.activityId,
      attempt_id: this.attemptId,
      event_type: 'taskEnded',
      task_id: this.taskId,
      score,
      task_name: 'sit2stand', // this.task.className. TODO: task_name can either be 'sit' or 'stand'.
    });
  }
}
