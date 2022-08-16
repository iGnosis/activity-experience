import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';
import { GameElement } from 'src/app/types/game-element';
import { ElementAttributes, ToastElementState } from 'src/app/types/pointmotion';
import { CalibrationService } from '../../calibration/calibration.service';

@Injectable({
  providedIn: 'root',
})
export class ToastService extends GameElement<ToastElementState, object> {
  constructor(calibrationService: CalibrationService) {
    super(calibrationService);
    this._subject = new Subject<{ data: ToastElementState; attributes: ElementAttributes }>();
    this._state = {
      data: {
        body: '',
        header: '',
      },
      attributes: {},
    };
  }
}
