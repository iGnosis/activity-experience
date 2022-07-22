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

  classify(pose: Results): { status: HandTrackerStatus } {
    if (!this.isEnabled) {
      return { status: undefined };
    }

    const postLandmarkArray = pose.poseLandmarks;
    const nose = postLandmarkArray[0];
    const rightWrist = postLandmarkArray[16];
    const leftWrist = postLandmarkArray[15];

    // make sure all the key body points are visible.
    if (
      (nose.visibility && nose.visibility < this.visibilityThreshold) ||
      (rightWrist.visibility && rightWrist.visibility < this.visibilityThreshold) ||
      (leftWrist.visibility && leftWrist.visibility < this.visibilityThreshold)
    ) {
      return { status: undefined };
    }

    let rDist = this.calcDist(nose.x, nose.y, rightWrist.x, rightWrist.y);
    rDist = parseFloat(rDist.toFixed(1));

    let lDist = this.calcDist(nose.x, nose.y, leftWrist.x, leftWrist.y);
    lDist = parseFloat(lDist.toFixed(1));

    if (lDist <= 0.2 && rDist <= 0.2) {
      return { status: 'both-hands' };
    }

    if (lDist <= 0.2) {
      return { status: 'left-hand' };
    }

    if (rDist <= 0.2) {
      return { status: 'right-hand' };
    }

    return { status: undefined };
  }
}
