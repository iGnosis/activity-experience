import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';
import { GameElement } from 'src/app/types/game-element';
import { ElementAttributes, ScoreElementState } from 'src/app/types/pointmotion';
import { CalibrationService } from '../../calibration/calibration.service';

@Injectable({
  providedIn: 'root',
})
export class ScoreService extends GameElement<ScoreElementState, object> {
  constructor(calibrationService: CalibrationService) {
    super(calibrationService);
    this._subject = new Subject<{ data: ScoreElementState; attributes: ElementAttributes }>();
    this._state = {
      data: {
        score: 0,
        icon: '/assets/images/xp-coin.png',
        position: {
          top: '50%',
          left: '75%',
        },
        showScoreGained: true,
      },
      attributes: {},
    };
  }
}
