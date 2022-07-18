import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';
import { GameElement } from 'src/app/types/game-element';
import { ElementAttributes, ScoreElementState } from 'src/app/types/pointmotion';

@Injectable({
  providedIn: 'root',
})
export class ScoreService extends GameElement<ScoreElementState, object> {
  constructor() {
    super();
    this._subject = new Subject<{ data: ScoreElementState; attributes: ElementAttributes }>();
    this._state = {
      data: {
        label: 'Score',
        value: '0',
      },
      attributes: {},
    };
  }
  setValue(value: number) {
    this._state.data.value = value;
    this._subject.next(this._state);
  }
}
