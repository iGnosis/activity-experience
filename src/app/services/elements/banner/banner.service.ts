import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';
import { GameElement } from 'src/app/types/game-element';
import { BannerElementState, ElementAttributes } from 'src/app/types/pointmotion';
import { CalibrationService } from '../../calibration/calibration.service';

@Injectable({
  providedIn: 'root',
})
export class BannerService extends GameElement<BannerElementState, object> {
  constructor(calibrationService: CalibrationService) {
    super(calibrationService);
    this._subject = new Subject<{ data: BannerElementState; attributes: ElementAttributes }>();
    this._state = {
      data: {},
      attributes: {},
    };
  }

  setState(input: BannerElementState) {
    this.state.data.htmlStr = input.htmlStr;
    this.state.data.buttons = input.buttons;
    this.subject.next(this.state);
  }
}
