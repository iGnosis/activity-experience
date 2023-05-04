import { Injectable } from '@angular/core';
import { GameElement } from 'src/app/types/game-element';
import { CalibrationService } from '../../calibration/calibration.service';
import { Subject } from 'rxjs';
import { ClinialScoreElementState, ElementAttributes } from 'src/app/types/pointmotion';

@Injectable({
  providedIn: 'root',
})
export class ClinicalScoreService extends GameElement<ClinialScoreElementState, object> {
  constructor(calibrationService: CalibrationService) {
    super(calibrationService);
    this._subject = new Subject<{
      data: ClinialScoreElementState;
      attributes: ElementAttributes;
    }>();
    this._state = {
      data: {},
      attributes: {},
    };
  }
}
