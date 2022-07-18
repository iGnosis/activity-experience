import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';
import { GameElement } from 'src/app/types/game-element';
import { ElementAttributes, TimerElementState } from 'src/app/types/pointmotion';

@Injectable({
  providedIn: 'root',
})
export class TimerService extends GameElement<TimerElementState, object> {
  constructor() {
    super();
    this._state = {
      data: {
        label: '',
        value: '',
      },
      attributes: {
        visibility: 'visible',
      },
    };
    this._subject = new Subject<{
      data: TimerElementState;
      attributes: ElementAttributes;
    }>();
  }
}
