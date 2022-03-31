import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import { VideoService } from 'src/app/services/video/video.service';
import { Observable } from 'rxjs';
import { UiHelperService } from 'src/app/services/ui-helper/ui-helper.service';
import { EventsService } from 'src/app/services/events/events.service';

@Injectable({
  providedIn: 'root',
})
export class SitToStandScene extends Phaser.Scene {
  
  constructor(
    private videoService: VideoService,
    private uiHelperService: UiHelperService,
    private eventService: EventsService,
    private store: Store<{ calibration: any; frame: any }>
  ) {
    super({ key: 'sit2stand' });
    this.eventService.addContext('sit2stand', this)
  }

  preload() {
  }

  create() {
      // this.add.circle(300, 300, 500, 0xFFFF00, 0.5)
      this.add.text(300, 300, 'Sit to stand activity')
  }

  override update(time: number, delta: number): void {
  }

  action_startCalibration(data: any) {
    // alert('action_startCalibration')
    console.log('start calibration screen');
    
    if (this.scene) {
      this.scene.start('calibration')
    }
  }

}
