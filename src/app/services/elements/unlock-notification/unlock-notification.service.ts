import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';
import { GameElement } from 'src/app/types/game-element';
import { ElementAttributes, UnlockNotificationElementState } from 'src/app/types/pointmotion';
import { CalibrationService } from '../../calibration/calibration.service';

@Injectable({
  providedIn: 'root',
})
export class UnlockNotificationService extends GameElement<UnlockNotificationElementState, object> {
  constructor(calibrationService: CalibrationService) {
    super(calibrationService);
    this._subject = new Subject<{
      data: UnlockNotificationElementState;
      attributes: ElementAttributes;
    }>();
    this._state = {
      data: {
        type: 'badge',
        title: 'Title',
      },
      attributes: {},
    };
  }
}
