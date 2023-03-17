import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';
import { GameElement } from 'src/app/types/game-element';
import { ElementAttributes, HealthElementState } from 'src/app/types/pointmotion';
import { CalibrationService } from '../../calibration/calibration.service';

@Injectable({
  providedIn: 'root',
})
export class HealthService extends GameElement<HealthElementState, object> {
  constructor(calibrationService: CalibrationService) {
    super(calibrationService);
    this._subject = new Subject<{ data: HealthElementState; attributes: ElementAttributes }>();
    this._state = {
      data: {
        value: 1,
        total: 3,
      },
      attributes: {},
    };
  }
}
