import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import { Results } from '@mediapipe/pose';
import { GuideState } from 'src/app/types/pointmotion';
@Injectable({
  providedIn: 'root',
})
export class SitToStandService {
  private enabled = false;
  private currentClass = 'unknown';
  distanceThreshold: any;

  public static calcDist(x1: number, y1: number, x2: number, y2: number): any {
    // distance = √[(x2 – x1)^2 + (y2 – y1)^2]
    const distance = Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
    return distance;
  }

  constructor(
    private store: Store<{
      calibration: any;
      spotlight: any;
      guide: GuideState;
    }>,
  ) {}

  debounce(func: any, timeout = 300) {
    let timer: any;
    return (...args: any[]) => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        func.apply(this, args);
      }, timeout);
    };
  }

  classify(pose: Results): {
    result: 'unknown' | 'disabled' | 'sit' | 'stand';
  } {
    if (this.enabled) {
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

      const isSittingL = distanceBetweenLeftShoulderAndHip > 1.5 * distanceBetweenLeftHipAndKnee;
      const isSittingR = distanceBetweenRightShoulderAndHip > 1.5 * distanceBetweenRightHipAndKnee;

      if (isSittingL && isSittingR) {
        console.log('sitting down');
        if (this.currentClass !== 'sit') {
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
      //   this.sendTaskEndedEvent(0);
      return {
        result: 'disabled',
      };
    }
  }

  enable() {
    this.enabled = true;
  }

  disable() {
    this.enabled = false;
  }

  isEnabled() {
    return this.enabled;
  }
}
