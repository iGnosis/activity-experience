import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';

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
    left?: Phaser.GameObjects.Rectangle,
    center?: Phaser.GameObjects.Rectangle
  } = {}
  
  constructor(
    private store: Store<{ calibration: any }>
    ) {
      super({ key: 'calibration' });
      console.log('in calibration scene')
    }
    
    
    preload() {
         this.load.svg('check', 'assets/images/circle-check-solid.svg');
         this.load.svg('wrong', 'assets/images/circle-xmark-solid.svg');
    }
    
    create() {

    //   this.add.text(300, 300, 'calibration', { fontSize: '30px' });
      this.drawCalibrationBox(40, 90, 'error')
      console.log('draw box')
    //     this.calibration$ = this.store.select((state) => state.calibration)
    //   this.calibration$.subscribe((result)=> {
    //     if(result && result.status) {
    //       switch(result.status) {
    //         case 'error':
    //         this.drawCalibrationBox(50, 90, 'error')
    //         break;
    //         case 'warning':
    //         this.drawCalibrationBox(50, 90, 'warning')
    //         break;
    //         case 'success': 
    //         this.drawCalibrationBox(50, 90, 'success')
    //         break;
    //       }
    //     }
    //   })
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
          // this.eventsService.dispatchEventName('calibration.scene', 'completed', {})
        }, 2000)
      }

      let { width, height } = this.sys.game.canvas;
        let calibrationBoxWidth = width * percentWidth / 100 
        console.log('calibrationBoxWidth: ', calibrationBoxWidth);
        const calibrationBoxHeight = height * percentHeight / 100
        console.log('calibrationBoxHeight: ',calibrationBoxHeight);
        
        this.calibrationRectangle.left = this.add.rectangle(
          (width - calibrationBoxWidth) / 4,
          height / 2,
          (width - calibrationBoxWidth) / 2,
          height
        );
        this.calibrationRectangle.right = this.add.rectangle(
          width - (width - calibrationBoxWidth) / 4,
          height / 2,
          (width - calibrationBoxWidth) / 2,
          height
        );
       
        this.calibrationRectangle.top = this.add.rectangle(
          width / 2,
          (height - calibrationBoxHeight) / 4,
          calibrationBoxWidth,
          (height - calibrationBoxHeight) / 2
        );
 
        this.calibrationRectangle.bottom = this.add.rectangle(
            width / 2,
            height - (height - calibrationBoxHeight) / 4,
            calibrationBoxWidth,
            (height - calibrationBoxHeight) / 2
            );
        
        this.calibrationRectangle.center = this.add
          .rectangle(
            (width - calibrationBoxWidth) / 2,
            (height - calibrationBoxHeight) / 2,
              calibrationBoxWidth,
            calibrationBoxHeight
          )
            .setOrigin(0, 0);
        

        // !this.calibrationRectangle.left ? this.calibrationRectangle.left = this.add.rectangle((width - calibrationBoxWidth) / 4, height / 2, (width - calibrationBoxWidth) / 2, height) : null
        // !this.calibrationRectangle.right? this.calibrationRectangle.right = this.add.rectangle(width - (width-calibrationBoxWidth)/4, height/2, (width-calibrationBoxWidth)/2, height): null
        // !this.calibrationRectangle.top? this.calibrationRectangle.top = this.add.rectangle(width/2, (height - calibrationBoxHeight)/4, calibrationBoxWidth, (height - calibrationBoxHeight)/2): null
        // !this.calibrationRectangle.bottom? this.calibrationRectangle.bottom = this.add.rectangle(width/2, height - (height - calibrationBoxHeight)/4, calibrationBoxWidth, (height - calibrationBoxHeight)/2): null
        
        let fillColor = 0x000066;
     
        switch (type) {
            case 'error': 
            fillColor = 0x000066;
            break
            case 'warning':
            fillColor = 0xFFFF00
            break 
            case 'success':
            fillColor = 0x00bd3e;
        }
      
      
      
      const x = ['top', 'right', 'bottom', 'left'].forEach(rect => {
        // @ts-ignore
        this.calibrationRectangle[rect].setAlpha(1)
        // @ts-ignore
        this.calibrationRectangle[rect].setFillStyle(fillColor, 0.5)
      })
      
        if (type == 'success') {
        this.tweens.add({
          targets: [this.calibrationRectangle.top, this.calibrationRectangle.right, this.calibrationRectangle.bottom, this.calibrationRectangle.left, this.calibrationRectangle.center],
          alpha: 0.9,
          duration: 2000,
            onComplete: () => {
              
                //@ts-ignore
            // this.eventsService.dispatchEventName('calibration.scene', 'completed', {})
            // Move to whatever activity was going on...
            // this.scene.start('sit2stand')
          }
        });
            
        this.calibrationRectangle.center.setStrokeStyle(4, 0xffffff);
        this.add.image(width / 2, height / 2, 'check').setScale(0.40)

        } else {
            
        this.tweens.getAllTweens().forEach(tween => {
                this.tweens.remove(tween)
            })
            Object.keys(this.calibrationRectangle).forEach(key => {
            // @ts-ignore
            this.calibrationRectangle[key].setAlpha(1)
            })
            
        this.calibrationRectangle.center.setStrokeStyle(4, 0xf73636);
        this.add
         .image(width/2, height/ 2, 'wrong')
         .setScale(0.40)
    }
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
    
    action_startActivity(data?: any) {
      this.scene.start('sit2stand')
    }
    
    action_startCalibration(data: any) {
      this.scene.start('calibration')
    }
  }
  