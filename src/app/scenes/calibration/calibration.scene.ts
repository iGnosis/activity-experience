import { Injectable } from '@angular/core';
import { UserService } from 'src/app/services/user/user.service';
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
  constructor(private userService: UserService,
    private videoService: VideoService,
    private store: Store<{calibration: String, frame: any}>) {
      super({key: 'calibration'})
      this.frame$ = store.select('frame')
      this.frame$.subscribe((update: any) => {
        // console.log(update.frame)
        this.texture = update.frame
      })
  }
    
  preload() {
    console.log(this.userService.debug())
    this.load.image('logo', 'assets/images/angular.svg')
    this.input.mouse.disableContextMenu()
    this.input.on('pointerdown', (e: any) => {
      this.invalid? this.store.dispatch(calibration.invalid()) : this.store.dispatch(calibration.noPersonDetected())
      this.invalid = !this.invalid
    })
    // this.webcam = this.load.image('webcam', '')
  }
  
  create(){
    // const webcam = this.add.dom(window.innerWidth/2, window.innerHeight/2, this.videoService.getVideoElement())
    var circle = this.add.circle(10, 10, 180, 0x6666ff);
    var image = this.add.image(200, 300, 'logo')
  }
  
  
  override update(time: number, delta: number): void {
    const image = new Image()
    image.src = this.texture || ''
    // debugger
    // Put the image on the scene
  }
    
  }
  