import { AfterViewInit, Component, ElementRef, ViewChild } from '@angular/core';
import * as Phaser from 'phaser';
import { CalibrationScene } from 'src/app/scenes/calibration/calibration.scene';
import { SitToStandScene } from 'src/app/scenes/sit-to-stand/sit-to-stand.scene';
import { CalibrationService } from 'src/app/services/calibration/calibration.service';
import { CareplanService } from 'src/app/services/careplan/careplan.service';
import { SitToStandService } from 'src/app/services/classifiers/sit-to-stand/sit-to-stand.service';
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
  @ViewChild('sessionElm') sessionElm!: ElementRef
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
    // private calibrationScene: CalibrationScene,
    // private sit2standScene: SitToStandScene,
    private uiHelperService: UiHelperService,
    private careplanService: CareplanService,
    private mpHolisticService: HolisticService,
    private sit2standService: SitToStandService,
    private eventsService: EventsService) {
      this.eventsService.addContext('session', this)
    }
  
  async ngAfterViewInit() {
    // Download the careplan. do it in the welcome page later
    this.careplan = this.careplanService.downloadCarePlan('')
    
    // Register the session component to send and receive events
    this.dispatcher = this.eventsService.addContext('session', this)

    const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false })
    this.video.nativeElement.srcObject = stream
    
    const box = this.uiHelperService.setBoundingBox(stream)
    this.updateDimensions(this.video.nativeElement)

    this.dispatcher?.dispatchEventName('ready')
    // this.dispatcher?.dispatchEventId('start_game')
  }

  updateDimensions(elm: HTMLVideoElement | HTMLCanvasElement) {
    const box = this.uiHelperService.getBoundingBox()
    if( box.topLeft.x ) {
      // the video needs padding on the left
      elm.style.marginLeft = box.topLeft.x +'px'
    } else if ( box.topLeft.y ) {
      // the video needs padding on the top
      elm.style.marginTop = box.topLeft.y +'px'
      elm.style.marginTop = box.topLeft.y +'px'
    }

    elm.width = box.topRight.x - box.topLeft.x 
    elm.height = box.bottomLeft.y - box.topLeft.y
  }
 
  async action_startCalibration(data: any) {
    
  }

  async action_startGame(data: any) {
    // setTimeout(() => {
    //   // Set the canvas to take up the same space as the video. Simplifying all the calculations
    //   const canvas = document.querySelector('#phaser-canvas canvas') as HTMLCanvasElement
    //   this.updateDimensions(canvas)
    //   // @ts-ignore.
    //   window.pm.session = this 
    //   // this.sessionElm.nativeElement.requestFullscreen()
    // })
  }

  action_startMediaPipe(data: any) {
    // Start MediaPipe Holistic
    console.log('STARTING MEDIAPIPE');
    
    this.mpHolisticService.start(this.video.nativeElement, 20)
  }
  
  action_restartGame(data: any) {
  }
}
