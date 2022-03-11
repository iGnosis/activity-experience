import { AfterViewInit, Component, ElementRef, ViewChild } from '@angular/core';
import * as Phaser from 'phaser';
import { CalibrationScene } from 'src/app/scenes/calibration/calibration.scene';
import { VideoService } from 'src/app/services/video/video.service';

@Component({
  selector: 'app-session',
  templateUrl: './session.component.html',
  styleUrls: ['./session.component.scss']
})
export class SessionComponent implements AfterViewInit {
  
  @ViewChild('videoElm') video!: ElementRef
  @ViewChild('canvasElm') canvas!: ElementRef
  session?: Phaser.Game
  config: Phaser.Types.Core.GameConfig = {
    type: Phaser.AUTO,
    width: window.innerWidth,
    height: window.innerHeight,
    physics: {
      default: 'arcade',
      arcade: {
        gravity: {y: 200}
      },
    },
  }
  
  // DI the needed scenes
  constructor(private calibrationScene: CalibrationScene, private videoService: VideoService) { }
  
  async ngAfterViewInit() {
    this.config.scene = [this.calibrationScene]
    this.session = new Phaser.Game(this.config)

    // get frames for the frames store
    const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false })
    this.video.nativeElement.width = stream.getTracks()[0].getSettings().width
    this.video.nativeElement.height = stream.getTracks()[0].getSettings().height
    this.video.nativeElement.srcObject = stream
    
    
    this.videoService.startExtractingFramesFromStream(stream, this.video.nativeElement, 30)
    // @ts-ignore
    // const camera = new window.Camera(this.video.nativeElement, {
    //   onFrame: async () => {
    //     // @ts-ignore
    //     // await window.holistic.send({image: videoElement});
    //     // console.log(this.video.nativeElement);
    //   },
    //   width: window.innerWidth,
    //   height: window.innerHeight
    // });
    // camera.start();
    // this.videoService.setVideoElement(this.video.nativeElement)
  }
  
}
