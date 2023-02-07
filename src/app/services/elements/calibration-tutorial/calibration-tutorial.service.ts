import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';
import { GameElement } from 'src/app/types/game-element';
import { CalibrationTutorialElementState, ElementAttributes } from 'src/app/types/pointmotion';
import { CalibrationService } from '../../calibration/calibration.service';

@Injectable({
  providedIn: 'root',
})
export class CalibrationTutorialService extends GameElement<
  CalibrationTutorialElementState,
  object
> {
  constructor(calibrationService: CalibrationService) {
    super(calibrationService);
    this._subject = new Subject<{
      data: CalibrationTutorialElementState;
      attributes: ElementAttributes;
    }>();
    this._state = {
      data: {},
      attributes: {},
    };
  }
}
