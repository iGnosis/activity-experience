import { AfterViewInit, Component, ElementRef, ViewChild } from '@angular/core';
import * as Phaser from 'phaser';
import { CalibrationScene } from 'src/app/scenes/calibration/calibration.scene';
import { HolisticService } from 'src/app/services/holistic/holistic.service';
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
    parent: 'phaser-canvas',
    // @ts-ignore
    'render.transparent': true,
    transparent: true,
    // backgroundColor: 'rgba(0,0,0,0)',
    physics: {
      default: 'arcade',
      arcade: {
        gravity: {y: 200}
      },
    },
  }
  
  // DI the needed scenes
  constructor(
    private calibrationScene: CalibrationScene,
    private holisticService: HolisticService,
    private videoService: VideoService) { }
  
  async ngAfterViewInit() {
    this.config.scene = [this.calibrationScene]
    this.session = new Phaser.Game(this.config)

    // get frames for the frames store
    const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false })
    this.video.nativeElement.width = window.innerWidth
    this.video.nativeElement.height = window.innerHeight
    this.video.nativeElement.srcObject = stream
    
    
    // this.videoService.startExtractingFramesFromStream(stream, this.video.nativeElement, 30)

    this.videoService.setVideoElement(this.video.nativeElement)
    this.holisticService.start(this.video.nativeElement, 30)
  }
  
}
