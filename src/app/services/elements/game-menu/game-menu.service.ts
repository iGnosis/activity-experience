import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';
import { GameElement } from 'src/app/types/game-element';
import { ElementAttributes, GameMenuElementState } from 'src/app/types/pointmotion';
import { CalibrationService } from '../../calibration/calibration.service';

@Injectable({
  providedIn: 'root',
})
export class GameMenuService extends GameElement<GameMenuElementState, object> {
  constructor(calibrationService: CalibrationService) {
    super(calibrationService);
    this._subject = new Subject<{ data: GameMenuElementState; attributes: ElementAttributes }>();
    this._state = {
      data: {
        gesture: undefined,
        holdDuration: 2000,
      },
      attributes: {},
    };
  }
}
