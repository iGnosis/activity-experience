import { Injectable } from '@angular/core';
import { Results } from '@mediapipe/pose';
import { Subject, Subscription } from 'rxjs';
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

  constructor(private poseService: PoseService) {}

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
        if (this.status === hand) {
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

    const postLandmarkArray = pose.poseLandmarks;
    const nose = postLandmarkArray[0];
    const rightWrist = postLandmarkArray[16];
    const rightElbow = postLandmarkArray[14];
    const leftWrist = postLandmarkArray[15];
    const leftElbow = postLandmarkArray[13];

    // make sure all the key body points are visible.
    if (
      (nose.visibility && nose.visibility < this.visibilityThreshold) ||
      (rightWrist.visibility && rightWrist.visibility < this.visibilityThreshold) ||
      (rightElbow.visibility && rightElbow.visibility < this.visibilityThreshold) ||
      (leftWrist.visibility && leftWrist.visibility < this.visibilityThreshold) ||
      (leftElbow.visibility && leftElbow.visibility < this.visibilityThreshold)
    ) {
      return { status: undefined };
    }

    // WRIST - NOSE
    let rDistWristNose = this.calcDist(nose.x, nose.y, rightWrist.x, rightWrist.y);
    rDistWristNose = parseFloat(rDistWristNose.toFixed(1));
    let lDistWristNose = this.calcDist(nose.x, nose.y, leftWrist.x, leftWrist.y);
    lDistWristNose = parseFloat(lDistWristNose.toFixed(1));

    if (lDistWristNose <= this.distanceThreshold && rDistWristNose <= this.distanceThreshold) {
      return { status: 'both-hands' };
    }

    if (lDistWristNose <= this.distanceThreshold) {
      return { status: 'left-hand' };
    }

    if (rDistWristNose <= this.distanceThreshold) {
      return { status: 'right-hand' };
    }

    // ELBOW - NOSE
    let rDistElbowtNose = this.calcDist(nose.x, nose.y, rightElbow.x, rightElbow.y);
    rDistElbowtNose = parseFloat(rDistElbowtNose.toFixed(1));
    let lDistElbowtNose = this.calcDist(nose.x, nose.y, leftElbow.x, leftElbow.y);
    lDistElbowtNose = parseFloat(lDistElbowtNose.toFixed(1));

    if (lDistElbowtNose <= this.distanceThreshold && rDistElbowtNose <= this.distanceThreshold) {
      return { status: 'both-hands' };
    }

    if (lDistElbowtNose <= this.distanceThreshold) {
      return { status: 'left-hand' };
    }

    if (rDistElbowtNose <= this.distanceThreshold) {
      return { status: 'right-hand' };
    }

    return { status: undefined };
  }
}
