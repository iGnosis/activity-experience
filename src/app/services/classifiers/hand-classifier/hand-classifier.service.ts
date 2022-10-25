import { Injectable } from '@angular/core';
import { HandsService } from '../../hands/hands.service';
import { Subscription } from 'rxjs';
import { Results } from '@mediapipe/hands';
import { Landmark } from 'src/assets/@mediapipe/hands';

@Injectable({
  providedIn: 'root',
})
export class HandClassifierService {
  private handSubscription: Subscription;
  enabled = false;

  constructor(private handsService: HandsService) {}

  enable() {
    this.enabled = true;
    this.subscribe();
  }

  subscribe() {
    this.handSubscription = this.handsService.results.subscribe((results) => {
      const classifiedResults = this.classify(results);
      console.log('classifiedResults::', classifiedResults);
    });
  }

  unsubscribe() {
    this.handSubscription.unsubscribe();
  }

  disable() {
    this.enabled = false;
    this.unsubscribe();
  }

  getAngle(a: Landmark, b: Landmark, c: Landmark) {
    const radians = Math.atan2(c.y - b.y, c.x - b.x) - Math.atan2(a.y - b.y, a.x - b.x);
    const angle = (radians * 180) / Math.PI;
    if (angle > 180) {
      return 360 - angle;
    }
    return Math.abs(angle);
  }

  fingers: { [key: string]: [number, number, number] } = {
    thumb: [2, 3, 4],
    index: [5, 6, 7],
    middle: [9, 10, 11],
    ring: [13, 14, 15],
    pinky: [17, 18, 19],
  };

  private checkIfFingerIsOpen(a: Landmark, b: Landmark, c: Landmark) {
    return this.getAngle(a, b, c) > 160;
  }

  private checkIfFingersAreWide(a: Landmark, b: Landmark) {
    return this.euclideanDist(a.x, a.y, b.x, b.y) > 0.01;
  }

  private euclideanDist(x1: number, y1: number, x2: number, y2: number): any {
    // distance = √[(x2 – x1)^2 + (y2 – y1)^2]
    return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
  }

  classify(
    results: Results,
  ): 'both-hands' | 'left-hand' | 'right-hand' | 'none' | 'unknown' | undefined {
    if (!this.enabled) return;

    const status: { [key: string]: boolean } = {};
    if (results.multiHandLandmarks) {
      for (const [idx, landmarks] of results.multiHandLandmarks.entries()) {
        const hand = results.multiHandedness[idx].label.toLowerCase();
        console.log('hand::', hand);

        status[hand] = true;
        for (const finger in this.fingers) {
          const [a, b, c] = this.fingers[finger];
          const isFingerOpen = this.checkIfFingerIsOpen(landmarks[a], landmarks[b], landmarks[c]);
          if (isFingerOpen === false) {
            status[hand] = false;
            break;
          }
        }

        const fingerArr = [
          [4, 8],
          [8, 12],
          [12, 16],
          [16, 20],
        ];

        for (const finger of fingerArr) {
          const [a, b] = finger;
          const isFingerWide = this.checkIfFingersAreWide(landmarks[a], landmarks[b]);
          if (isFingerWide === false) {
            status[hand] = false;
            break;
          }
        }
      }

      if (status['left'] && status['right']) {
        return 'both-hands';
      } else if (status['left'] && !status['right']) {
        return 'left-hand';
      } else if (!status['left'] && status['right']) {
        return 'right-hand';
      } else {
        return 'none';
      }
    }

    return 'unknown';
  }
}
