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
        mode: 'start',
        duration: 0,
        onComplete: () => {},
      },
      attributes: {
        visibility: 'hidden',
      },
    };
    this._subject = new Subject<{
      data: TimerElementState;
      attributes: ElementAttributes;
    }>();
  }

  set(value: TimerElementState) {
    this.state.data.mode = value.mode;
    this.state.data.duration = value.duration;
    // timer is set to 30 min, if the duration is not specified during start mode.
    if (value.mode === 'start' && !value.duration) {
      this.state.data.duration = 30 * 60 * 1000;
    }
    this.state.data.onComplete = value.onComplete;
    this.state.attributes.visibility = 'visible';
    this.subject.next(this.state);
  }

  stop() {
    this.state.data.mode = 'stop';
    this.state.attributes.visibility = 'hidden';
    this.subject.next(this.state);
  }
}
