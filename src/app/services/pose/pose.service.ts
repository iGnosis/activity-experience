import { Injectable } from '@angular/core';
import { Options, Pose, Results } from '@mediapipe/pose';
import { Observable, Subject, take } from 'rxjs';
import { CalibrationScene } from 'src/app/scenes/calibration/calibration.scene';
import { Coordinate, IsMediaPipeReady } from 'src/app/types/pointmotion';
@Injectable({
  providedIn: 'root',
})
export class PoseService {
  options: Options = {
    modelComplexity: 2,
    minDetectionConfidence: 0.5,
    minTrackingConfidence: 0.5,
  };
  interval: any;
  videoElm?: HTMLVideoElement;
  numOfResults = 0;
  pose: Pose;
  config: 'cdn' | 'local';
  results = new Subject<Results>();
  isReady = new Subject<IsMediaPipeReady>();
  totalPoseFiles = 0;

  constructor() {}

  async start(videoElm: HTMLVideoElement, fps = 35, config: 'cdn' | 'local' = 'local') {
    try {
      // mediapipe isn't ready yet.
      this.isReady.next({
        isMediaPipeReady: false,
        downloadSource: config,
      });

      this.config = config;
      let baseUrl = 'https://cdn.jsdelivr.net/npm/@mediapipe/pose/';
      if (config === 'local') {
        baseUrl = '/assets/@mediapipe/pose/';
      }
      this.pose = new Pose({
        locateFile: (file) => {
          this.totalPoseFiles++;
          console.log('loading holistic file:', file);
          // stick to v0.5 as to avoid breaking changes.
          return baseUrl + file;
          // return `assets/mediapipe/holistic/0.5/${file}`;
        },
      });

      this.pose.setOptions(this.options);

      this.pose.onResults((results) => {
        this.handleResults(results);
      });

      this.videoElm = videoElm;

      // We need to wait until Holistic is done loading the files, only then we set the interval.
      await this.pose?.send({ image: this.videoElm });

      // do something
      console.log('holistic files must be loaded by now');

      // emit an event when mediapipe is ready.
      this.isReady.next({
        isMediaPipeReady: true,
        downloadSource: config,
      });

      // This implementation may be faulty!
      // Shoudn't we read frames every (displayFPSRate * 1000) milliseconds?
      this.interval = setInterval(() => {
        if (this.videoElm) {
          this.pose?.send({ image: this.videoElm });
        }
      }, 30);
    } finally {
      this.checkForFailure();
    }
  }

  stop() {
    clearInterval(this.interval);
  }

  getMediapipeStatus() {
    return this.isReady;
  }

  getPose() {
    return this.results;
  }

  checkForFailure() {
    setTimeout(() => {
      if (this.numOfResults < 15) {
        // Sometimes a few frames are received before it fails
        this.stop(); // stop sending the frames.

        if (this.config == 'cdn') {
          // Cloud didn't work, local didn't work...
          // let the user know now...
          this.results.error({
            status: 'error',
          });
          this.isReady.error({
            status: 'Failed to download mediapipe.',
          });
        } else {
          this.start(this.videoElm as HTMLVideoElement, 25, 'cdn');
        }
      }
    }, 15000); // 15 seconds
  }

  private handleResults(results: Results) {
    if (results) {
      this.numOfResults += 1; // increment the number till 100 only
      this.results.next(results);
    }
  }

  /**
   * Tests whether mediapipe has loaded, if not, it uses an alternative configuration and try loading it...
   */
  test() {}

  async getHeightRatio(): Promise<number> {
    const windowHeight = window.innerHeight;
    const playerHeight = await this.getHeightFromPose();

    return playerHeight / windowHeight;
  }

  private getHeightFromPose(): Promise<number> {
    return new Promise((resolve) => {
      this.results.pipe(take(1)).subscribe((results) => {
        const eye = {
          x: window.innerWidth * results.poseLandmarks[1].x,
          y: window.innerHeight * results.poseLandmarks[1].y,
        };
        const leg = {
          x: window.innerWidth * results.poseLandmarks[27].x,
          y: window.innerHeight * results.poseLandmarks[27].y,
        };

        const playerHeight: number = Math.sqrt(
          Math.pow(leg.x - eye.x, 2) + Math.pow(leg.y - eye.y, 2),
        );

        resolve(playerHeight);
      });
    });
  }
}
