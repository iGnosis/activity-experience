import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';
import { GameElement } from 'src/app/types/game-element';
import { ElementAttributes, TitleBarElementState } from 'src/app/types/pointmotion';
import { CalibrationService } from '../../calibration/calibration.service';
@Injectable({
  providedIn: 'root',
})
export class TitleBarService extends GameElement<TitleBarElementState, object> {
  constructor(calibrationService: CalibrationService) {
    super(calibrationService);
    this._subject = new Subject<{
      data: TitleBarElementState;
      attributes: ElementAttributes;
    }>();
    this._state = {
      data: {
        title: 'Title',
      },
      attributes: {},
    };
  }
}
