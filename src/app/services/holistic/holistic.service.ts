import { Injectable } from '@angular/core';
import { Holistic, Options } from '@mediapipe/holistic';
import { Store } from '@ngrx/store';
import { pose } from 'src/app/store/actions/pose.actions';
import { Results } from 'src/app/types/pointmotion';
import { CalibrationService } from '../calibration/calibration.service';

@Injectable({
  providedIn: 'root'
})
export class HolisticService {

  holistic?: Holistic
  options: Options = {
    modelComplexity: 1,
    smoothLandmarks: true,
    enableSegmentation: true,
    smoothSegmentation: true,
    refineFaceLandmarks: true,
    minDetectionConfidence: 0.5,
    minTrackingConfidence: 0.5
  }
  interval: any
  videoElm?: HTMLVideoElement
  constructor(
    private store: Store<{ pose: Results }>,
    private calibrationService: CalibrationService,
  ) {

  }

  start(videoElm: HTMLVideoElement, fps: number = 1) {

    this.holistic = new Holistic({
      locateFile: (file) => {
        console.log('loading holistic:', file);
        // return `assets/mediapipe/holistic/${file}`;
        return `https://cdn.jsdelivr.net/npm/@mediapipe/holistic/${file}`;
      }
    });

    this.holistic.setOptions(this.options)
    this.holistic.onResults((results) => {
      // // @ts-ignore
      // results.createdAt = new Date()
      this.handleResults(results)
    })

    this.videoElm = videoElm
    this.interval = setInterval(() => {
      // @ts-ignore
      this.holistic?.send({ image: this.videoElm }).catch((error) => {
        console.error('error sending image to the model:', error)
      })
    }, 500)
  }

  stop() {
    clearInterval(this.interval)
    // throw new Error('not implemented')
  }

  private handleResults(results: Results) {
    // console.log(results)
    if (results) {
      this.store.dispatch(pose.send({ pose: results }))
    }
  }
}
