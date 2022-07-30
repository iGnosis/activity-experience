import { Injectable } from '@angular/core';
import { NormalizedLandmark, NormalizedLandmarkList, Results } from '@mediapipe/pose';
import { debounceTime, Subject, Subscription } from 'rxjs';
import { HandTrackerStatus } from 'src/app/types/pointmotion';
import { PoseService } from '../../pose/pose.service';

@Injectable({
  providedIn: 'root',
})
export class HandTrackerService {
  isEnabled = false;
  visibilityThreshold = 0.7;
  distanceThreshold = 0.2;
  subscription: Subscription;
  result = new Subject<HandTrackerStatus>();
  status: HandTrackerStatus = undefined;
  debouncedStatus: HandTrackerStatus = undefined;

  constructor(private poseService: PoseService) {
    this.result.pipe(debounceTime(2000)).subscribe((status: HandTrackerStatus) => {
      this.debouncedStatus = status;
      console.log('HandTrackerService:debouncedStatus:', this.status);
    });
  }

  enable() {
    this.isEnabled = true;
    this.subscription = this.poseService.getPose().subscribe((results) => {
      const newStatus = this.classify(results);
      if (!newStatus) return;
      if (newStatus.status != this.status) {
        this.result.next(newStatus.status);
      }
      this.status = newStatus.status;
    });
  }

  disable() {
    this.isEnabled = false;
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }

  calcDist(x1: number, y1: number, x2: number, y2: number): any {
    // distance = √[(x2 – x1)^2 + (y2 – y1)^2]
    const distance = Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
    return distance;
  }

  async waitUntilHandRaised(hand: HandTrackerStatus) {
    return new Promise((resolve, _) => {
      const interval = setInterval(() => {
        if (this.debouncedStatus === hand) {
          clearInterval(interval);
          resolve({});
        }
      }, 300);
    });
  }

  classify(pose: Results): { status: HandTrackerStatus } {
    if (!this.isEnabled || !pose || !pose.poseLandmarks) {
      return { status: undefined };
    }

    const poseLandmarkArray = pose.poseLandmarks;
    const nose = poseLandmarkArray[0];
    const rightWrist = poseLandmarkArray[16];
    const rightElbow = poseLandmarkArray[14];
    const leftWrist = poseLandmarkArray[15];
    const leftElbow = poseLandmarkArray[13];

    // First, considers nose - elbow. As, the elbow is more likely to be always visible.
    if (this._isElbowsVisible(poseLandmarkArray)) {
      const status = this._noseElbowYDist(nose, leftElbow, rightElbow);
      if (status) {
        return { status };
      }
    }

    // We then consider nose - wrist.
    if (this._isWristsVisible(poseLandmarkArray)) {
      const status = this._noseWristYDist(nose, leftWrist, rightWrist);
      if (status) {
        return { status };
      }
    }

    return { status: undefined };
  }

  _isWristsVisible(poseLandmarkArray: NormalizedLandmarkList): boolean {
    const nose = poseLandmarkArray[0];
    const rightWrist = poseLandmarkArray[16];
    const leftWrist = poseLandmarkArray[15];
    if (
      (nose.visibility && nose.visibility < this.visibilityThreshold) ||
      (rightWrist.visibility && rightWrist.visibility < this.visibilityThreshold) ||
      (leftWrist.visibility && leftWrist.visibility < this.visibilityThreshold)
    ) {
      return false;
    }
    return true;
  }

  _isElbowsVisible(poseLandmarkArray: NormalizedLandmarkList): boolean {
    const nose = poseLandmarkArray[0];
    const rightElbow = poseLandmarkArray[14];
    const leftElbow = poseLandmarkArray[13];
    if (
      (nose.visibility && nose.visibility < this.visibilityThreshold) ||
      (rightElbow.visibility && rightElbow.visibility < this.visibilityThreshold) ||
      (leftElbow.visibility && leftElbow.visibility < this.visibilityThreshold)
    ) {
      return false;
    }
    return true;
  }

  _noseElbowYDist(
    nose: NormalizedLandmark,
    leftElbow: NormalizedLandmark,
    rightElbow: NormalizedLandmark,
  ): HandTrackerStatus {
    const yNoseLeftElbowDiff = parseFloat((nose.y - leftElbow.y).toFixed(1));
    const yNoseRightElbowDiff = parseFloat((nose.y - rightElbow.y).toFixed(1));
    if (yNoseLeftElbowDiff >= 0 && yNoseRightElbowDiff >= 0) {
      return 'both-hands';
    }
    if (yNoseLeftElbowDiff >= 0) {
      return 'left-hand';
    }
    if (yNoseRightElbowDiff >= 0) {
      return 'right-hand';
    }
    return undefined;
  }

  _noseWristYDist(
    nose: NormalizedLandmark,
    leftWrist: NormalizedLandmark,
    rightWrist: NormalizedLandmark,
  ): HandTrackerStatus {
    const yNoseLeftWristDiff = parseFloat((nose.y - leftWrist.y).toFixed(1));
    const yNoseRightWristDiff = parseFloat((nose.y - rightWrist.y).toFixed(1));
    if (yNoseLeftWristDiff >= 0 && yNoseRightWristDiff >= 0) {
      return 'both-hands';
    }
    if (yNoseLeftWristDiff >= 0) {
      return 'left-hand';
    }
    if (yNoseRightWristDiff >= 0) {
      return 'right-hand';
    }
    return undefined;
  }
}
