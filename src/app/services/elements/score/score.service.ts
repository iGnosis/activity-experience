import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';
import { GameElement } from 'src/app/types/game-element';
import { ScoreElementState } from 'src/app/types/pointmotion';

@Injectable({
  providedIn: 'root',
})
export class ScoreService extends GameElement<ScoreElementState> {
  constructor() {
    super();
    this._subject = new Subject<ScoreElementState>();
    this._state = {
      label: 'Score',
      value: 0,
    };
  }
  incrementScore() {
    if (typeof this._state.value === 'number') {
      this._state = { ...this._state, value: this._state.value + 1 };
      this._subject.next(this._state);
    }
  }
}
