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
    this._subject = new Subject<TimerElementState>();
    this._state = {
      mode: 'start',
      duration: 0,
      onComplete: () => {},
    };
  }

  set(value: TimerElementState) {
    this.state.mode = value.mode;
    this.state.duration = value.duration;
    // timer is set to 30 min, if the duration is not specified during start mode.
    if (value.mode === 'start' && !value.duration) {
      this.state.duration = 30 * 60 * 1000;
    }
    this.state.onComplete = value.onComplete;
    this.subject.next(this.state);
  }
}
