import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';
import { GameElement } from 'src/app/types/game-element';
import { TimerElementState } from 'src/app/types/pointmotion';

@Injectable({
  providedIn: 'root',
})
export class TimerService extends GameElement<TimerElementState> {
  constructor() {
    super();
    this._state = {
      show: false,
      label: '',
      value: '',
    };
    this._subject = new Subject<TimerElementState>();
  }
}
