import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import { VideoService } from 'src/app/services/video/video.service';
import { Observable } from 'rxjs';
import { UiHelperService } from 'src/app/services/ui-helper/ui-helper.service';

@Injectable({
  providedIn: 'root',
})
export class SitToStandScene extends Phaser.Scene {
  
  constructor(
    private videoService: VideoService,
    private uiHelperService: UiHelperService,
    private store: Store<{ calibration: any; frame: any }>
  ) {
    super({ key: 'sit2stand' });
  }

  preload() {
  }

  create() {
      this.add.circle(300, 300, 500, 0xFFFF00, 0.5)
  }

  override update(time: number, delta: number): void {
  }

}
