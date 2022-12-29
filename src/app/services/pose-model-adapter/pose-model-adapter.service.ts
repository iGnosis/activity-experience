import { Injectable } from '@angular/core';
import { AvailableModelsEnum } from 'src/app/types/pointmotion';
import { PoseService } from '../pose/pose.service';
import { PosenetService } from '../posenet/posenet.service';

@Injectable({
  providedIn: 'root',
})
export class PoseModelAdapter {
  private isPosenetActivated = false;
  private isMediapipeActivated = false;

  constructor(private poseService: PoseService, private posenetService: PosenetService) {}

  /**
   *  will start poseModel that takes in the video feed from a video element and provides pose esults.
   * @param videoElm Video element to take image from
   * @param fps framerate of the device/ framerate at which the game is running.
   * @param model choose which model to run.
   * @param config `local` | `cdn`  mediapipe/pose source
   */
  async start(videoElm: HTMLVideoElement, fps = 35, config: 'cdn' | 'local' = 'local') {
    if (this.isMediapipeActivated) {
      this.poseService.start(videoElm, fps, config);
    } else if (this.isPosenetActivated) {
      this.posenetService.start(videoElm);
    }
  }

  setModel(model: 'mediapipe' | 'posenet') {
    console.log('setModel:', model);
    if (model === 'mediapipe') {
      this.isMediapipeActivated = true;
    } else if (model === 'posenet') {
      this.isPosenetActivated = true;
    }
  }

  isAnyModelEnabled() {
    if (this.isMediapipeActivated || this.isPosenetActivated) {
      return true;
    }
    return false;
  }

  getPose() {
    if (this.isMediapipeActivated) {
      return this.poseService.getPose();
    } else if (this.isPosenetActivated) {
      return this.posenetService.getPose();
    }
    throw new Error('getPose:Model not active!');
  }

  getStatus() {
    if (this.isMediapipeActivated) {
      return this.poseService.getStatus();
    } else if (this.isPosenetActivated) {
      return this.posenetService.getStatus();
    }
    throw new Error('getStatus:Model not active!');
  }

  getHeightRatio() {
    if (this.isMediapipeActivated) {
      return this.poseService.getHeightRatio();
    } else if (this.isPosenetActivated) {
      return this.posenetService.getHeightRatio();
    }
    throw new Error('getHeightRatio:Model not active!');
  }
}
