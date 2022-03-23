import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import { calibration } from 'src/app/store/actions/calibration.actions';
import { VideoService } from 'src/app/services/video/video.service';
import { Observable } from 'rxjs';
import { ColdObservable } from 'rxjs/internal/testing/ColdObservable';
import { UiHelperService } from 'src/app/services/ui-helper/ui-helper.service';

@Injectable({
  providedIn: 'root',
})
export class CalibrationScene extends Phaser.Scene {
  invalid = false;
  webcam: any;
  frame$?: Observable<any>;
  calibration$?: Observable<any>;
  texture?: string;

  calibrationStatus = 'success'

  // @ts-ignore
  calibrationRectangle: {
    top?:  Phaser.GameObjects.Rectangle,
    right?:  Phaser.GameObjects.Rectangle,
    bottom?:  Phaser.GameObjects.Rectangle,
    left?:  Phaser.GameObjects.Rectangle,
  }

  constructor(
    private videoService: VideoService,
    private uiHelperService: UiHelperService,
    private store: Store<{ calibration: any; frame: any }>
  ) {
    super({ key: 'calibration' });
    this.frame$ = store.select('frame');
    this.frame$.subscribe((update: any) => {
    });

    this.calibration$ = store.select('calibration')
    this.calibration$.subscribe((result)=> {
      // if(result && result.status) {
      //   // console.log(result.status);
      //   // console.log(result.details.pose.faceLandmarks);
        
      //   switch(result.status) {
      //     case 'error':
      //       this.calibrationRectangle?.setStrokeStyle(5, 0xFF0000)
      //       break;
      //     case 'warning':
      //       this.calibrationRectangle?.setStrokeStyle(5, 0xFFFF00)
      //       break;
      //     case 'success': 
      //     this.calibrationRectangle?.setStrokeStyle(5, 0x00FF00)
      //       break;
      //   }
      // }

      // if(result.details.pose.faceLandmarks) {
      //   result.details.pose.faceLandmarks.forEach((landmark: {x: number, y: number}, idx: number) => {
      //     // this.uiHelperService.locatePoint()
      //   })
      // }
      
    })
    this.calibrationRectangle = {
    }
  }

  preload() {
    // load calibration guide images
    this.load.image('move-back', 'assets/images/move-back.png');
    this.load.image('move-left', 'assets/images/move-left.png');
  }

  create() {
    this.drawCalibrationBox(50, 90, 'success')
  }

  override update(time: number, delta: number): void {
    // if (this.calibrationStatus == 'success') {
    //   // if the box is present
    //   if(this.calibrationRectangle.top && this.calibrationRectangle.right && this.calibrationRectangle.bottom && this.calibrationRectangle.left) {
    //     this.calibrationRectangle.top.fillAlpha -= 0.1
    //     this.calibrationRectangle.right.fillAlpha -= 0.1
    //     this.calibrationRectangle.bottom.fillAlpha -= 0.1
    //     this.calibrationRectangle.left.fillAlpha -= 0.1 
    //   }
    // }
  }

  /**
   * 
   * @param percentWidth percentage of the bounding-box width
   * @param percentHeight percentage of the bounding-box height
   */
  drawCalibrationBox(percentWidth: number, percentHeight: number, type: string) {
    let { width, height } = this.sys.game.canvas;
    const calibrationBoxWidth = width * percentWidth / 100 
    const calibrationBoxHeight = height * percentHeight / 100
    let fillColor = 0xFF0000
    switch(type) {
      case 'error': 
        fillColor = 0xFF0000
        break
      case 'warning':
        fillColor = 0xFFFF00
        break 
      case 'success':
        fillColor = 0x00FF00
    }
    this.calibrationRectangle.left = this.add.rectangle((width-calibrationBoxWidth)/4, height/2, (width-calibrationBoxWidth)/2, height, fillColor, 0.5)
    this.calibrationRectangle.right = this.add.rectangle(width - (width-calibrationBoxWidth)/4, height/2, (width-calibrationBoxWidth)/2, height, fillColor, 0.5)
    this.calibrationRectangle.top = this.add.rectangle(width/2, (height - calibrationBoxHeight)/4, calibrationBoxWidth, (height - calibrationBoxHeight)/2, fillColor, 0.5)
    this.calibrationRectangle.bottom = this.add.rectangle(width/2, height - (height - calibrationBoxHeight)/4, calibrationBoxWidth, (height - calibrationBoxHeight)/2, fillColor, 0.5)

    if (type == 'success') {
      this.tweens.add({
        targets: [this.calibrationRectangle.top, this.calibrationRectangle.right, this.calibrationRectangle.bottom, this.calibrationRectangle.left],
        alpha: 0,
        duration: 3000,
        onComplete: () => {
          this.scene.start('sit2stand')
        }
    });
    }
  }

}
