import { Injectable } from '@angular/core';
import { Holistic, Options } from '@mediapipe/holistic';
import { Store } from '@ngrx/store';
import { pose } from 'src/app/store/actions/pose.actions';
import { Results } from 'src/app/types/pointmotion';

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
  ) {
  }

  async start(videoElm: HTMLVideoElement, fps: number = 25) {
    this.holistic = new Holistic({
      locateFile: (file) => {
        console.log('loading holistic file:', file)
        // stick to v0.5 as to avoid breaking changes.
        return `https://cdn.jsdelivr.net/npm/@mediapipe/holistic@0.5/${file}`;
      }
    });

    this.holistic.setOptions(this.options)
    this.holistic.onResults((results) => {
      this.handleResults(results)
    })
    this.videoElm = videoElm

    // We need to wait until Holistic is done loading the files, only then we set the interval.
    // @ts-ignore
    await this.holistic?.send({ image: this.videoElm })

    // This implementation may be faulty!
    // Shoudn't we read frames every (displayFPSRate * 1000) milliseconds?
    this.interval = setInterval(() => {
      // @ts-ignore
      this.holistic?.send({ image: this.videoElm })
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
