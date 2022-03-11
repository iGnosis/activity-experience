import { Injectable } from '@angular/core';
import { Holistic, Options, Results } from '@mediapipe/holistic';
import { Store } from '@ngrx/store';
import { pose } from 'src/app/store/actions/pose.actions';
import { CalibrationService } from '../calibration/calibration.service';

@Injectable({
  providedIn: 'root'
})
export class HolisticService {

  holistic: Holistic
  options: Options
  interval: any
  videoElm?: HTMLVideoElement
  constructor(
    private store: Store<{pose: Results}>,
    private calibrationService: CalibrationService,
  ) { 
    this.holistic = new Holistic({locateFile: (file) => {
      return `https://cdn.jsdelivr.net/npm/@mediapipe/holistic/${file}`;
    }});

    this.options = {
      modelComplexity: 1,
      smoothLandmarks: true,
      enableSegmentation: true,
      smoothSegmentation: true,
      refineFaceLandmarks: true,
      minDetectionConfidence: 0.5,
      minTrackingConfidence: 0.5
    }

    this.holistic.setOptions(this.options)
  }

  start(videoElm: HTMLVideoElement, fps: number = 1) {
    this.holistic.onResults((results) => {
      this.handleResults(results)
    })
    this.videoElm = videoElm
    this.interval = setInterval(() => {
      try {
        // @ts-ignore
        this.holistic.send({image: this.videoElm})
      } catch(err) {
        console.error('error sending image to the model')
      }
    }, 1000)
  }

  stop() {
    clearInterval(this.interval)
    // throw new Error('not implemented')
  }

  handleResults(results: Results) {
    // console.log(results)
    this.store.dispatch(pose.send({pose: results}))
  }
  
}
