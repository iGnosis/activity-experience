import { Inject, Injectable } from '@angular/core';
import { NormalizedLandmarkList, Results } from '@mediapipe/pose';
import { Subject, take } from 'rxjs';
import { IsModelReady } from 'src/app/types/pointmotion';
import * as posenet from '@tensorflow-models/posenet';
import { DOCUMENT } from '@angular/common';

@Injectable({
  providedIn: 'root',
})
export class PosenetService {
  private window: any;
  private poseNet: any;

  private videoElm?: HTMLVideoElement;
  private numOfResults = 0;

  private poseNetOptions = {
    /**
     * A number between 0.2 and 1.
     * What to scale the image by before feeding it through the network.
     * Set this number lower to scale down the image and increase the speed when feeding through the network at the cost of accuracy.
     */
    scaleFactor: 0.8,

    /**
     * If the poses should be flipped/mirrored horizontally.
     * This should be set to true for videos where the video is by default flipped horizontally (i.e. a webcam),
     * and you want the poses to be returned in the proper orientation.
     */
    flipHorizontal: false,

    /**
     * Can be one of 1.01, 1.0, 0.75, or 0.50
     * (The value is used only by the MobileNetV1 architecture and not by the ResNet architecture).
     * It is the float multiplier for the depth (number of channels) for all convolution ops.
     * The larger the value, the larger the size of the layers, and more accurate the model at the cost of speed. Set this to a smaller value to increase speed at the cost of accuracy.
     */
    // multiplier: 0.75,

    /**
     * Can be one of 161, 193, 257, 289, 321, 353, 385, 417, 449, 481, 513, and 801. Defaults to 257.
     * It specifies the size the image is resized to before it is fed into the PoseNet model.
     * The larger the value, the more accurate the model at the cost of speed.
     * Set this to a smaller value to increase speed at the cost of accuracy.
     */
    inputResolution: 481,

    detectionType: 'single',
  };

  private isReady = new Subject<IsModelReady>();
  private interval: any;
  private net: posenet.PoseNet;
  private results = new Subject<Results>();
  public mediapipeBodyPoints = {
    nose: 0,
    leftEyeInner: 1,
    leftEye: 2,
    leftEyeOuter: 3,
    rightEyeInner: 4,
    rightEye: 5,
    rightEyeOuter: 6,
    leftEar: 7,
    rightEar: 8,
    mouthLeft: 9,
    mouthRight: 10,
    leftShoulder: 11,
    rightShoulder: 12,
    leftElbow: 13,
    rightElbow: 14,
    leftWrist: 15,
    rightWrist: 16,
    leftPinky: 17,
    rightPinky: 18,
    leftIndex: 19,
    rightIndex: 20,
    leftThumb: 21,
    rightThumb: 22,
    leftHip: 23,
    rightHip: 24,
    leftKnee: 25,
    rightKnee: 26,
    leftAnkle: 27,
    rightAnkle: 28,
    leftHeel: 29,
    rightHeel: 30,
    leftFootIndex: 31,
    rightFootIndex: 32,
  };

  constructor(@Inject(DOCUMENT) private document: Document) {
    this.window = this.document.defaultView;
  }

  // converts Posenet output to mediapipe output.
  private transformPosenetResults(pose: posenet.Pose, video: HTMLVideoElement): Results {
    const transformedRes: NormalizedLandmarkList = [];

    for (let i = 0; i < Object.keys(this.mediapipeBodyPoints).length; i++) {
      const posenetPoint = pose.keypoints.find(
        (val) => val.part === Object.keys(this.mediapipeBodyPoints)[i],
      );
      if (posenetPoint) {
        transformedRes.push({
          visibility: posenetPoint.score,
          x: posenetPoint.position.x / video.width,
          y: posenetPoint.position.y / video.height,
          z: 0,
        });
      } else {
        transformedRes.push({
          visibility: 0,
          x: 0,
          y: 0,
          z: 0,
        });
      }
    }
    return {
      poseLandmarks: transformedRes,
      poseWorldLandmarks: [],
      segmentationMask: document.createElement('img'), // dummy img element to comform to TS types
      image: document.createElement('img'), // dummy img element to comform to TS types
    };
  }

  async start(videoElm: HTMLVideoElement) {
    this.videoElm = videoElm;

    // emit an event when posenet is ready.
    this.isReady.next({
      isModelReady: false,
      downloadSource: 'local',
    });

    this.poseNet = this.window.ml5.poseNet(this.videoElm, this.poseNetOptions, () => {
      console.log('posenet model loaded');
      this.isReady.next({
        isModelReady: true,
        downloadSource: 'local', // workaround so UI popup stay right -- it's actually through CDN.
      });
    });

    this.poseNet.on('pose', (results: any) => {
      // posenet outputs multiple results if more than 1 people are detected.
      // we consider results only when there is one person detected.
      if (results && results.length === 1 && results[0].pose) {
        const transformedRes = this.transformPosenetResults(results[0].pose, this.videoElm!);
        this.handleResults(transformedRes);
      }
    });
  }

  private handleResults(results: Results) {
    if (results) {
      this.numOfResults += 1;
      this.results.next(results);
    }
  }

  getStatus() {
    return this.isReady;
  }

  getPose() {
    return this.results;
  }

  stop() {
    clearInterval(this.interval);
    this.net.dispose();
  }

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
