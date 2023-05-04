import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';
import { GameElement } from 'src/app/types/game-element';
import { ElementAttributes, GoalSelectionElementState } from 'src/app/types/pointmotion';
import { CalibrationService } from '../../calibration/calibration.service';
@Injectable({
  providedIn: 'root',
})
export class GoalSelectionService extends GameElement<GoalSelectionElementState, object> {
  constructor(calibrationService: CalibrationService) {
    super(calibrationService);
    this._subject = new Subject<{
      data: GoalSelectionElementState;
      attributes: ElementAttributes;
    }>();
    this._state = {
      data: {
        goals: [{ title: 'Goal 1', id: 'Description 1', xp: 300 }],
      },
      attributes: {},
    };
  }
}
