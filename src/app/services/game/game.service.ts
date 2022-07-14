import { Injectable } from '@angular/core';
import { AppInjector } from 'src/app/app.module';
import { CalibrationScene } from 'src/app/scenes/calibration/calibration.scene';
import { SitToStandScene } from 'src/app/scenes/sit-to-stand/sit-to-stand.scene';
import { CalibrationService } from '../calibration/calibration.service';
import { ElementsService } from '../elements/elements.service';
import { PoseService } from '../pose/pose.service';
import { UiHelperService } from '../ui-helper/ui-helper.service';

@Injectable({
  providedIn: 'root',
})
export class GameService {
  game?: Phaser.Game;
  config: Phaser.Types.Core.GameConfig = {
    type: Phaser.AUTO,
    width: window.innerWidth,
    height: window.innerHeight,
    parent: 'phaser-canvas',
    render: {
      transparent: true,
    },
    transparent: true,
    // backgroundColor: 'rgba(0,0,0,0)',
    physics: {
      default: 'arcade',
      arcade: {
        gravity: { y: 200 },
      },
    },
  };
  calibrationStatus: 'error' | 'warning' | 'success' = 'error';

  constructor(
    private elements: ElementsService,
    private uiHelperService: UiHelperService,
    private calibrationService: CalibrationService,
    private calibrationScene: CalibrationScene,
    private sitToStandScene: SitToStandScene,
    private poseService: PoseService,
  ) {}

  async start(video: HTMLVideoElement, canvas: HTMLCanvasElement) {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: false,
      });
      video.srcObject = stream;
      const box = this.uiHelperService.setBoundingBox(stream);
      this.updateDimensions(video);
      await this.setPhaserDimensions(canvas);
      await this.startPoseDetection(video);
      this.setupSubscriptions();
    } catch (err: any) {
      console.log(err);
    }
  }

  setPhaserDimensions(canvas: HTMLCanvasElement) {
    return new Promise((resolve) => {
      const scenes = this.getScenes();
      this.config.scene = scenes;
      this.game = new Phaser.Game(this.config);
      this.updateDimensions(canvas.querySelector('canvas') as HTMLCanvasElement);
      resolve({});
    });
  }

  startPoseDetection(video: HTMLVideoElement) {
    return new Promise((resolve) => {
      setTimeout(() => {
        this.poseService.start(video);
        resolve({});
      }, 1000);
    });
  }

  getScenes() {
    return [this.calibrationScene, this.sitToStandScene];
  }

  setupSubscriptions() {
    this.calibrationService.enable();
    this.calibrationService.result.subscribe((status: any) => {
      this.calibrationStatus = status;
    });
  }

  updateDimensions(elm: HTMLVideoElement | HTMLCanvasElement) {
    const box = this.uiHelperService.getBoundingBox();
    if (box.topLeft.x) {
      // the video needs padding on the left
      elm.style.marginLeft = box.topLeft.x + 'px';
    } else if (box.topLeft.y) {
      // the video needs padding on the top
      elm.style.marginTop = box.topLeft.y + 'px';
      elm.style.marginTop = box.topLeft.y + 'px';
    }

    elm.width = box.topRight.x - box.topLeft.x;
    elm.height = box.bottomLeft.y - box.topLeft.y;
  }
}
