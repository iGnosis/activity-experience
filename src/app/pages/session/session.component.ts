import { AfterViewInit, Component, ElementRef, ViewChild } from '@angular/core';
import * as Phaser from 'phaser';
import { CalibrationScene } from 'src/app/scenes/calibration/calibration.scene';
import { CareplanService } from 'src/app/services/careplan/careplan.service';
import { EventsService } from 'src/app/services/events/events.service';
import { HolisticService } from 'src/app/services/holistic/holistic.service';
import { UiHelperService } from 'src/app/services/ui-helper/ui-helper.service';
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
  careplan: any
  dispatcher?: {dispatchEventName: Function, dispatchEventId: Function}
  
  // DI the needed scenes
  constructor(
    private calibrationScene: CalibrationScene,
    // private holisticService: HolisticService,
    private uiHelperService: UiHelperService,
    private careplanService: CareplanService,
    private eventsService: EventsService,
    private videoService: VideoService) { 
    }
  
  async ngAfterViewInit() {
    // Download the careplan. do it in the welcome page later
    this.careplan = this.careplanService.downloadCarePlan('')
    this.dispatcher = this.eventsService.addContext('system', this)

    // TODO: Set the assets to be preloaded for the activity
    // this.config.scene = [this.calibrationScene]
    // this.session = new Phaser.Game(this.config)

    

    // get frames for the frames store
    // const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false })
    // this.video.nativeElement.width = window.innerWidth
    // this.video.nativeElement.height = window.innerHeight
    // this.video.nativeElement.srcObject = stream
    
    
    // this.videoService.startExtractingFramesFromStream(stream, this.video.nativeElement, 30)

    // this.videoService.setVideoElement(this.video.nativeElement)
    // this.holisticService.start(this.video.nativeElement, 30)
    // const box = this.uiHelperService.setBoundingBox(stream)
    // console.log(box)

    setTimeout(() => {
      this.dispatcher?.dispatchEventName('ready')
    }, 1000)

  }
  
}
