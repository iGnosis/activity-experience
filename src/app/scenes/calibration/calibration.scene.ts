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

  calibrationRectangle?: Phaser.GameObjects.Rectangle
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
      if(result && result.status) {
        // console.log(result.status);
        // console.log(result.details.pose.faceLandmarks);
        
        switch(result.status) {
          case 'error':
            this.calibrationRectangle?.setStrokeStyle(5, 0xFF0000)
            break;
          case 'warning':
            this.calibrationRectangle?.setStrokeStyle(5, 0xFFFF00)
            break;
          case 'success': 
          this.calibrationRectangle?.setStrokeStyle(5, 0x00FF00)
            break;
        }
      }

      // if(result.details.pose.faceLandmarks) {
      //   result.details.pose.faceLandmarks.forEach((landmark: {x: number, y: number}, idx: number) => {
      //     // this.uiHelperService.locatePoint()
      //   })
      // }
      
    })
    
  }

  preload() {
    // load calibration guide images
    this.load.image('move-back', 'assets/images/move-back.png');
    this.load.image('move-left', 'assets/images/move-left.png');
  }

  create() {
    // this.cameras.main.setBackgroundColor()
    // this.cameras.main.setBackgroundColor('rgba(0, 0, 0, 0)');
    // const webcam = this.add.dom(window.innerWidth/2, window.innerHeight/2, this.videoService.getVideoElement())
    var circle = this.add.circle(10, 10, 180, 0x6666ff);
    // var image = this.add.image(300, 300, 'webcam')
    // Phaser.Display.Align.In.Center(image, this.add.zone(0, 0, window.innerWidth, window.innerHeight))

    // add a rectangle
    // use proper x, y co-ordinates here.
    const bounds = this.uiHelperService.getBoundingBox()
    this.calibrationRectangle = this.add.rectangle(
      window.innerWidth / 2,
      window.innerHeight / 2,
      bounds.topRight.x - bounds.topLeft.x,
      bounds.bottomLeft.y - bounds.topLeft.y
    );

    // set linewidth=3 and lineColor=red
    this.calibrationRectangle.setStrokeStyle(5, 0xFF0000);

    // this.add.image(300, 300, 'move-back').setScale(0.5);
    // this.add.image(300, 600, 'move-left').setScale(0.5);
  }

  override update(time: number, delta: number): void {
    // const image = new Image()
    // image.src = this.texture || ''
    // debugger
    // Put the image on the scene
  }
}
