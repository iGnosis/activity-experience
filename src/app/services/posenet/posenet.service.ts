import { Injectable } from '@angular/core';
import { NormalizedLandmarkList, Results } from '@mediapipe/pose';
import * as posenet from '@tensorflow-models/posenet';
import { Subject, take } from 'rxjs';
import { IsModelReady } from 'src/app/types/pointmotion';

@Injectable({
  providedIn: 'root',
})
export class PosenetService {
  private videoElm?: HTMLVideoElement;

  /**
   * A number between 0.2 and 1.
   * What to scale the image by before feeding it through the network.
   * Set this number lower to scale down the image and increase the speed when feeding through the network at the cost of accuracy.
   */
  private scaleFactor = 0.5;

  /**
   * If the poses should be flipped/mirrored horizontally.
   * This should be set to true for videos where the video is by default flipped horizontally (i.e. a webcam),
   * and you want the poses to be returned in the proper orientation.
   */
  private flipHorizontal = true;

  /**
   * Internally, this parameter affects the height and width of the layers in the neural network.
   * At a high level, it affects the accuracy and speed of the pose estimation.
   * The lower the value of the output stride the higher the accuracy but slower the speed,
   * the higher the value the faster the speed but lower the accuracy.
   */
  private outputStride = 16;

  private numOfResults = 0;
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

  constructor() {}

  // converts Posenet output to mediapipe output.
  transformPosenetResults(pose: posenet.Pose): Results {
    const transformedRes: NormalizedLandmarkList = [];

    for (let i = 0; i < Object.keys(this.mediapipeBodyPoints).length; i++) {
      const posenetPoint = pose.keypoints.find(
        (val) => val.part === Object.keys(this.mediapipeBodyPoints)[i],
      );
      if (posenetPoint) {
        transformedRes.push({
          visibility: posenetPoint.score,
          x: posenetPoint.position.x / screen.width,
          y: posenetPoint.position.y / screen.height,
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
    const net = await posenet.load();
    // emit an event when posenet is ready.
    this.isReady.next({
      isModelReady: true,
      downloadSource: 'cdn',
    });

    this.videoElm = videoElm;
    this.interval = setInterval(async () => {
      if (this.videoElm) {
        const pose = await net.estimateSinglePose(videoElm, {
          flipHorizontal: this.flipHorizontal,
        });
        const transformedRes = this.transformPosenetResults(pose);
        this.handleResults(transformedRes);
        // console.log('transformedRes::', transformedRes);
      }
    }, 30);
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
