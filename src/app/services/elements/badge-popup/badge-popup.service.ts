import { Injectable } from '@angular/core';
import { GameElement } from 'src/app/types/game-element';
import { BadgePopupElementState, ElementAttributes } from 'src/app/types/pointmotion';
import { CalibrationService } from '../../calibration/calibration.service';
import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class BadgePopupService extends GameElement<BadgePopupElementState, object> {
  constructor(calibrationService: CalibrationService) {
    super(calibrationService);
    this._subject = new Subject<{ data: BadgePopupElementState; attributes: ElementAttributes }>();
    this._state = {
      data: {},
      attributes: {},
    };
  }
}
