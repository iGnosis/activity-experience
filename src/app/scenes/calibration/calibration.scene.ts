import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store'
import { calibration } from 'src/app/store/actions/calibration.actions';
import { VideoService } from 'src/app/services/video/video.service';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class CalibrationScene extends Phaser.Scene {
  
  invalid = false
  webcam: any
  frame$?: Observable<any>
  texture?: string
  constructor(
    private videoService: VideoService,
    private store: Store<{calibration: String, frame: any}>
  ) {
      super({key: 'calibration'})
      this.frame$ = store.select('frame')
      this.frame$.subscribe((update: any) => {
        // console.log(update.frame)

        // const img = new Image(400, 500)
        // img.src = update.frame 
        // // const texture = new Phaser.Textures.Texture()
        // this.texture = update.frame
        // if(this.texture) {
        //   // console.log(this.texture);
          
        //   this.textures.remove('webcam')
        //   this.textures.once('addtexture',  () => {
        //     // this.add.image(200, 300, 'webcam');
        //   }, this);
      
        //   this.textures.addBase64('webcam', update.frame);
        // }
      })
  }
    
  preload() {
    // this.load.image('webcam', 'assets/images/loading.png')
    
    // this.input.mouse.disableContextMenu()
    // this.input.on('pointerdown', (e: any) => {
    //   this.invalid? this.store.dispatch(calibration.invalid()) : this.store.dispatch(calibration.noPersonDetected())
    //   this.invalid = !this.invalid
    // })
    // this.webcam = this.load.image('webcam', '')
  }
  
  create(){
    // this.cameras.main.setBackgroundColor()
    this.cameras.main.setBackgroundColor('rgba(0, 0, 0, 0)');
    // const webcam = this.add.dom(window.innerWidth/2, window.innerHeight/2, this.videoService.getVideoElement())
    var circle = this.add.circle(10, 10, 180, 0x6666ff);
    // var image = this.add.image(300, 300, 'webcam')
    // Phaser.Display.Align.In.Center(image, this.add.zone(0, 0, window.innerWidth, window.innerHeight))
  }
  
  
  override update(time: number, delta: number): void {
    // const image = new Image()
    // image.src = this.texture || ''
   
    
    // debugger
    // Put the image on the scene
  }
    
  }
  