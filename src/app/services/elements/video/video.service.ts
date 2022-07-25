import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';
import { GameElement } from 'src/app/types/game-element';
import { ElementAttributes, VideoElementState } from 'src/app/types/pointmotion';
import { CalibrationService } from '../../calibration/calibration.service';

@Injectable({
  providedIn: 'root',
})
export class VideoService extends GameElement<VideoElementState, object> {
  constructor(calibrationService: CalibrationService) {
    super(calibrationService);
    this._subject = new Subject<{ data: VideoElementState; attributes: ElementAttributes }>();
    this._state = {
      data: {
        type: 'gif',
        src: '',
        title: '',
        description: '',
      },
      attributes: {},
    };
  }
}
