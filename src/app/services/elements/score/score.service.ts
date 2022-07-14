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
    this._subject = new Subject();
    this._state = {
      show: false,
      label: '',
      value: '',
    };
  }
}
