import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { EventsService } from 'src/app/services/events/events.service';

@Injectable({
  providedIn: 'root',
})
export class CalibrationScene extends Phaser.Scene {
  invalid = false;
  webcam: any;
  frame$?: Observable<any>;
  calibration$?: Observable<any>;
  texture?: string;
  showCalibration = true
  
  calibrationStatus = 'success'
  
  // @ts-ignore
  calibrationRectangle: {
    top?:  Phaser.GameObjects.Rectangle,
    right?:  Phaser.GameObjects.Rectangle,
    bottom?:  Phaser.GameObjects.Rectangle,
    left?:  Phaser.GameObjects.Rectangle,
  } = {}
  
  constructor(
    private eventsService: EventsService,
    private store: Store<{ calibration: any }>
    ) {
      super({ key: 'calibration' });
    }
    
    
    preload() {
    }
    
    create() {
      this.calibration$ = this.store.select((state) => state.calibration)
      this.calibration$.subscribe((result)=> {
        if(result && result.status) {
          switch(result.status) {
            case 'error':
            this.drawCalibrationBox(50, 90, 'error')
            break;
            case 'warning':
            this.drawCalibrationBox(50, 90, 'warning')
            break;
            case 'success': 
            this.drawCalibrationBox(50, 90, 'success')
            break;
          }
        }
      })
      this.eventsService.addContext('calibration.scene', this)
    }
    
    override update(time: number, delta: number): void {
    }
    
    /**
    * 
    * @param percentWidth percentage of the bounding-box width
    * @param percentHeight percentage of the bounding-box height
    */
    drawCalibrationBox(percentWidth: number, percentHeight: number, type: string) {
      if (!this.sys.game) return
      if(!this.showCalibration) return
      
      if(type == 'success') {
        setTimeout(() => {
          this.eventsService.dispatchEventName('calibration.scene', 'completed', {})
        }, 2000)
      }

      // let { width, height } = this.sys.game.canvas;
      // const calibrationBoxWidth = width * percentWidth / 100 
      // const calibrationBoxHeight = height * percentHeight / 100
      // let fillColor = 0xFF0000
      
      // switch(type) {
      //   case 'error': 
      //   fillColor = 0xFF0000
      //   break
      //   case 'warning':
      //   fillColor = 0xFFFF00
      //   break 
      //   case 'success':
      //   fillColor = 0x00FF00
      // }
      
      
      // !this.calibrationRectangle.left? this.calibrationRectangle.left = this.add.rectangle((width-calibrationBoxWidth)/4, height/2, (width-calibrationBoxWidth)/2, height): null
      // !this.calibrationRectangle.right? this.calibrationRectangle.right = this.add.rectangle(width - (width-calibrationBoxWidth)/4, height/2, (width-calibrationBoxWidth)/2, height): null
      // !this.calibrationRectangle.top? this.calibrationRectangle.top = this.add.rectangle(width/2, (height - calibrationBoxHeight)/4, calibrationBoxWidth, (height - calibrationBoxHeight)/2): null
      // !this.calibrationRectangle.bottom? this.calibrationRectangle.bottom = this.add.rectangle(width/2, height - (height - calibrationBoxHeight)/4, calibrationBoxWidth, (height - calibrationBoxHeight)/2): null
      
      
      // const x = ['top', 'right', 'bottom', 'left'].forEach(rect => {
      //   // @ts-ignore
      //   this.calibrationRectangle[rect].setAlpha(1)
      //   // @ts-ignore
      //   this.calibrationRectangle[rect].setFillStyle(fillColor, 0.5)
      // })
      
      // if (type == 'success') {
      //   this.tweens.add({
      //     targets: [this.calibrationRectangle.top, this.calibrationRectangle.right, this.calibrationRectangle.bottom, this.calibrationRectangle.left],
      //     alpha: 0.3,
      //     duration: 2000,
      //     onComplete: () => {
      //       this.eventsService.dispatchEventName('calibration.scene', 'completed', {})
      //       // Move to whatever activity was going on...
      //       // this.scene.start('sit2stand')
      //     }
      //   });
      // } else {
      //   this.tweens.getAllTweens().forEach(tween => {
      //     this.tweens.remove(tween)
      //   })
        
      //   Object.keys(this.calibrationRectangle).forEach(key => {
      //     // @ts-ignore
      //     this.calibrationRectangle[key].setAlpha(1)
      //   })
      // }
    }
    
    
    action_hideCalibrationBox(data: any) {
      this.showCalibration = false
      // @ts-ignore
      [this.calibrationRectangle.top, this.calibrationRectangle.right, this.calibrationRectangle.bottom, this.calibrationRectangle.left].forEach(rect => {
        if(rect) rect.setAlpha(0)
      })
    }
    
    action_showCalibrationBox(data:any) {
      this.showCalibration = true
      // @ts-ignore
      Object.keys(this.calibrationRectangle).forEach((rect: Phaser.GameObjects.Rectangle) => {
        if(rect) rect.setAlpha(1)
      })
    }
    
    action_startActivity(data: any) {
      this.scene.start('sit2stand')
    }
    
    action_startCalibration(data: any) {
      this.scene.start('calibration')
    }
  }
  