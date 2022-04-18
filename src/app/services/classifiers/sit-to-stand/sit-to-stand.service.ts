import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import { guide } from 'src/app/store/actions/guide.actions';
import { spotlight } from 'src/app/store/actions/spotlight.actions';
import { Results, GuideActionShowMessageDTO, GuideState } from 'src/app/types/pointmotion';
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
  private isEnabled = false;
  private currentClass = 'unknown';
  private repsCompleted = 0;
  private totalTasks = 0;
  private activityExplained = false;
  private task = {
    text: '1',
    timeout: 5000,
    className: 'stand',
    celebrated: false,
  };

  activityId: string;
  taskId = v4();
  attemptId = v4();

  constructor(
    private careplan: CareplanService,
    private store: Store<{ calibration: any; spotlight: any, guide: GuideState }>,
    private analyticsService: AnalyticsService,
    private soundService: SoundsService,
    private calibrationScene: CalibrationScene
  ) {
    this.activityId = this.analyticsService.getActivityId('Sit to Stand');

    this.analyticsService.sendActivityEvent({
      activity: this.activityId,
      event_type: 'activityStarted',
    });

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
          this.enable();
          this.reStartActivity();
          if (!this.soundService.isConstantDrumPlaying()) {
            this.soundService.startConstantDrum();
          }
        } else if (status == 'warning') {
          // warning will not stop the activity
          this.enable();
          this.reStartActivity();
          if (!this.soundService.isConstantDrumPlaying()) {
            this.soundService.startConstantDrum();
          }
        } else if (status == 'error' && this.activityExplained) {
          this.disable();
          if (this.soundService.isConstantDrumPlaying()) {
            this.soundService.pauseConstantDrum();
          }
          this.calibrationScene.scene.start('calibration');
          // if the calibration is error
          // debouncing the pauseActivity() for 3 seconds
          //   this.debounce(this.pauseActivity(), 3000);
        }
      });
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

      const distanceBetweenLeftShoulderAndHip = this._calcDist(
        leftShoulder.x,
        leftShoulder.y,
        leftHip.x,
        leftHip.y
      );
      const distanceBetweenRightShoulderAndHip = this._calcDist(
        rightShoulder.x,
        rightShoulder.y,
        rightHip.x,
        rightHip.y
      );
      const distanceBetweenLeftHipAndKnee = this._calcDist(
        leftHip.x,
        leftHip.y,
        leftKnee.x,
        leftKnee.y
      );
      const distanceBetweenRightHipAndKnee = this._calcDist(
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
        distanceBetweenRightShoulderAndHip >
        1.5 * distanceBetweenRightHipAndKnee;

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
        this.soundService.startConstantDrum();

      console.error({
        text: 'Please SIT when you see and EVEN number and STAND when you see ODD number',
        title: 'Ready?',
        timeout: 1000,
      });

      // this.store.dispatch(
      //   guide.sendMessages({
      //     text: 'Please SIT when you see and EVEN number and STAND when you see ODD number',
      //     title: 'Ready?',
      //     timeout: 1000,
      //   })
      // );
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
    this.disable();
    // this.store.dispatch(
    //   guide.sendMessages({
    //     text: 'Activity pause',
    //     title: 'pause',
    //     timeout: 3000,
    //   })
    // );
    console.error({
      text: 'Activity pause',
      title: 'pause',
      timeout: 3000,
    });
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

      // this.store.dispatch(
      //   guide.sendMessages({ text: 'DONE', title: 'Thank you!', timeout: 5000 })
      // );
      console.error({ text: 'DONE', title: 'Thank you!', timeout: 5000 });

      this.soundService.endConstantDrum();

      const failedTasks = this.totalTasks - this.repsCompleted;
      // store failed events

      this.isEnabled = false;
      // setting sessionEnded to true
      return;
    }

    this.getNewTask();

    // this.analyticsService.sendTaskEvent({
    //   activity: this.activityId,
    //   attempt_id: this.attemptId,
    //   event_type: 'taskStarted',
    //   task_id: this.taskId,
    //   task_name: 'sit2stand',
    // });

    // set the task in a class variable and watch the class from the store.
    if (this.isEnabled) {
      this.store.dispatch(
        guide.sendPrompt({ position: 'center', text: this.task.text, className: 'round' })
      )
    }

    // this.isEnabled &&
    //   this.store.dispatch(
    //     guide.sendMessages({
    //       text: this.task.text,
    //       title: this.task.title,
    //       timeout: this.task.timeout,
    //     })
    //   );

    console.error({
      text: this.task.text,
      // title: this.task.title,
      timeout: this.task.timeout,
    });

    this.isEnabled &&
      setTimeout(() => {
        // Check if the person held the right pose, but we did not celebrate...
        if (this.currentClass == this.task.className && !this.task.celebrated) {
          this.celebrate();
          this.sendTaskEndedEvent(1);
          this.playSuccessTune();
        }
        this.runActivity();
      }, this.task.timeout);
  }

  getNewTask() {
    this.attemptId = v4();
    this.taskId = v4();

    // 0 - 99
    const randomNum = Math.floor(Math.random() * 100)
    let className = 'stand'

    // sit on even numbers
    if (randomNum % 2 === 0) {
      className = 'sit'
    }

    // init new task
    this.task.text = `${randomNum}`
    this.task.className = className
    this.task.timeout = 5000
    this.task.celebrated = false
    this.totalTasks++;
  }

  enable() {
    this.isEnabled = true;
  }

  disable() {
    this.isEnabled = false;
  }

  sendTaskEndedEvent(score: number) {
    this.analyticsService.sendTaskEvent({
      activity: this.activityId,
      attempt_id: this.attemptId,
      event_type: 'taskEnded',
      task_id: this.taskId,
      score,
      task_name: 'sit2stand',
    });
  }

  _calcDist(x1: number, y1: number, x2: number, y2: number): any {
    // distance = √[(x2 – x1)^2 + (y2 – y1)^2]
    const distance = Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
    return distance;
  }
}
