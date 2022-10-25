import { Injectable } from '@angular/core';
import { Hands, Options, Results } from '@mediapipe/hands';
import { Subject } from 'rxjs';
import { IsHandsModelReady } from 'src/app/types/pointmotion';

@Injectable({
  providedIn: 'root',
})
export class HandsService {
  options: Options = {
    maxNumHands: 2,
    minDetectionConfidence: 0.5,
    minTrackingConfidence: 0.5,
    modelComplexity: 1,
    selfieMode: true,
  };

  interval: any;
  numOfResults = 0;
  videoElm?: HTMLVideoElement;
  config: 'cdn' | 'local';
  results = new Subject<Results>();
  hands: Hands;
  isReady = new Subject<IsHandsModelReady>();

  constructor() {}

  async start(videoElm: HTMLVideoElement, fps = 35, config: 'cdn' | 'local' = 'local') {
    try {
      this.isReady.next({
        isHandsModelReady: false,
        downloadSource: config,
      });

      this.config = config;
      this.videoElm = videoElm;

      let baseUrl = 'https://cdn.jsdelivr.net/npm/@mediapipe/hands/';
      if (config === 'local') {
        baseUrl = '/assets/@mediapipe/hands/';
      }

      this.hands = new Hands({
        locateFile: (file) => {
          console.log('loading hands file:', file);
          return baseUrl + file;
        },
      });

      this.hands.setOptions(this.options);
      this.hands.onResults((results) => {
        this.handleResults(results);
      });
      await this.hands.send({ image: videoElm });

      console.log('HandModel files must be loaded by now!');

      this.isReady.next({
        isHandsModelReady: true,
        downloadSource: config,
      });

      this.interval = setInterval(() => {
        if (videoElm) {
          this.hands.send({ image: videoElm });
        }
      }, 30);
    } finally {
      this.checkForFailure();
    }
  }

  getHands() {
    return this.results;
  }

  stop() {
    clearInterval(this.interval);
  }

  getMediapipeStatus() {
    return this.isReady;
  }

  checkForFailure() {
    setTimeout(() => {
      if (this.numOfResults < 15) {
        this.stop();
        if (this.config == 'cdn') {
          // Cloud didn't work, local didn't work. let the user know now...
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
    }, 15000);
  }

  private handleResults(results: Results) {
    if (results) {
      this.numOfResults += 1;
      this.results.next(results);
    }
  }
}
