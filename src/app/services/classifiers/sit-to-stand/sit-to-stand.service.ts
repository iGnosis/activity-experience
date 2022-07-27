import { Injectable } from '@angular/core';
import { Results } from '@mediapipe/pose';
import { Subscription } from 'rxjs';
import { PoseService } from '../../pose/pose.service';
@Injectable({
  providedIn: 'root',
})
export class SitToStandService {
  private enabled = false;
  private currentClass: 'unknown' | 'disabled' | 'sit' | 'stand' = 'unknown';
  distanceThreshold: any;
  subscription: Subscription;

  public static calcDist(x1: number, y1: number, x2: number, y2: number): any {
    // distance = √[(x2 – x1)^2 + (y2 – y1)^2]
    const distance = Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
    return distance;
  }

  constructor(private poseService: PoseService) {}

  enable() {
    this.enabled = true;
    this.subscription = this.poseService.getPose().subscribe((results) => {
      this.currentClass = this.classify(results).result;
    });
  }

  classify(pose: Results): {
    result: 'unknown' | 'disabled' | 'sit' | 'stand';
  } {
    if (this.enabled && pose && pose.poseLandmarks) {
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
        leftHip.y,
      );
      const distanceBetweenRightShoulderAndHip = SitToStandService.calcDist(
        rightShoulder.x,
        rightShoulder.y,
        rightHip.x,
        rightHip.y,
      );
      const distanceBetweenLeftHipAndKnee = SitToStandService.calcDist(
        leftHip.x,
        leftHip.y,
        leftKnee.x,
        leftKnee.y,
      );
      const distanceBetweenRightHipAndKnee = SitToStandService.calcDist(
        rightHip.x,
        rightHip.y,
        rightKnee.x,
        rightKnee.y,
      );

      // console.log(`dist - L: s-h: ${distanceBetweenLeftShoulderAndHip} h-k: ${distanceBetweenLeftHipAndKnee}`)
      // console.log(`dist - R: s-h: ${distanceBetweenRightShoulderAndHip} h-k: ${distanceBetweenRightHipAndKnee}`)

      const isSittingL = distanceBetweenLeftShoulderAndHip > 1.5 * distanceBetweenLeftHipAndKnee;
      const isSittingR = distanceBetweenRightShoulderAndHip > 1.5 * distanceBetweenRightHipAndKnee;

      if (isSittingL && isSittingR) {
        if (this.currentClass !== 'sit') {
          // the class has changed... use it for evaluation
          this.currentClass = 'sit';
        }
        return {
          result: 'sit',
        };
      } else {
        if (this.currentClass !== 'stand') {
          this.currentClass = 'stand';
        }
        return {
          result: 'stand',
        };
      }
    } else {
      return {
        result: 'disabled',
      };
    }
  }

  async waitForClassChangeOrTimeOut(
    desiredClass: string,
    timeout = 3000,
  ): Promise<{ result: 'success' | 'failure' }> {
    return new Promise((resolve) => {
      if (this.currentClass === desiredClass) {
        const startTime = new Date().getTime();
        const interval = setInterval(() => {
          if (new Date().getTime() - startTime > timeout) {
            if (this.currentClass === desiredClass) {
              resolve({
                result: 'success',
              });
              clearInterval(interval);
            } else {
              resolve({
                result: 'failure',
              });
              clearInterval(interval);
            }
          }
          if (this.currentClass !== desiredClass) {
            resolve({
              result: 'failure',
            });
            clearInterval(interval);
          }
        }, 300);
      } else {
        const startTime = new Date().getTime();
        const interval = setInterval(() => {
          if (new Date().getTime() - startTime > timeout) {
            resolve({
              result: 'failure',
            });
            clearInterval(interval);
          }
          if (this.currentClass == desiredClass) {
            resolve({
              result: 'success',
            });
            clearInterval(interval);
          }
        }, 300);
      }
    });
  }

  disable() {
    this.enabled = false;
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }

  isEnabled() {
    return this.enabled;
  }
  updateTimer(totalSeconds: number) {
    let minutes = 0;
    if (totalSeconds >= 60) {
      minutes = Math.floor(totalSeconds / 60);
      totalSeconds -= 60 * minutes;
    }
    let time = { minutes: '0', seconds: '00' };
    time = {
      minutes:
        minutes < 10
          ? (time.minutes = '0' + minutes.toString())
          : (time.minutes = minutes.toString()),
      seconds:
        totalSeconds < 10
          ? (time.seconds = '0' + totalSeconds.toString())
          : (time.seconds = totalSeconds.toString()),
    };
    return time;
  }
}
