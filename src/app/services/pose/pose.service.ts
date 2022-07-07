import { Injectable } from '@angular/core';
import { Options, Pose, Results } from '@mediapipe/pose';
import { Observable, Subject } from 'rxjs';
import { CalibrationScene } from 'src/app/scenes/calibration/calibration.scene';

@Injectable({
  providedIn: 'root',
})
export class PoseService {
  options: Options = {
    modelComplexity: 1,
    minDetectionConfidence: 0.5,
    minTrackingConfidence: 0.5,
  };
  interval: any;
  videoElm?: HTMLVideoElement;
  numOfResults = 0;
  pose: Pose;
  private results = new Subject<Results>();

  constructor(private calibrationScene: CalibrationScene) {}

  async start(videoElm: HTMLVideoElement, fps = 25, config: 'cdn' | 'local' = 'cdn') {
    const baseUrl = 'https://cdn.jsdelivr.net/npm/@mediapipe/pose/';
    // if (config === 'local') {
    //   baseUrl = '/assets/mediapipe/holistic/0.5/';
    // }
    // baseUrl = '/assets/mediapipe/holistic/0.5/';
    this.pose = new Pose({
      locateFile: (file) => {
        console.log('loading holistic file:', file);
        // stick to v0.5 as to avoid breaking changes.
        return baseUrl + file;
        // return `assets/mediapipe/holistic/0.5/${file}`;
      },
    });

    this.pose.setOptions(this.options);
    this.pose.onResults((results) => {
      // as soon as we are getting the new results we are destroying the exisiting calibration pose and points to make it look more realtime!
      this.calibrationScene.destroyGraphics();
      this.handleResults(results);
    });
    this.videoElm = videoElm;

    // await this.holistic.initialize();
    // We need to wait until Holistic is done loading the files, only then we set the interval.
    await this.pose?.send({ image: this.videoElm });

    // do something
    console.log('holistic files must be loaded by now');

    // This implementation may be faulty!
    // Shoudn't we read frames every (displayFPSRate * 1000) milliseconds?
    this.interval = setInterval(() => {
      if (this.videoElm) {
        this.pose?.send({ image: this.videoElm });
      }
    }, 200);
  }

  stop() {
    clearInterval(this.interval);
    // throw new Error('not implemented')
  }

  getPose() {
    return this.results;
  }

  private handleResults(results: Results) {
    // console.log(results)
    if (results) {
      this.numOfResults += 1; // increment the number till 100 only
      this.results.next(results);
    }
  }
}
