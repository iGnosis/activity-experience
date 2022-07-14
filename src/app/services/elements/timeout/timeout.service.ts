import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';
import { GameElement } from 'src/app/types/game-element';
import { TimeoutElementState } from 'src/app/types/pointmotion';

@Injectable({
  providedIn: 'root',
})
export class TimeoutService extends GameElement<TimeoutElementState> {
  constructor() {
    super();
    this._subject = new Subject<TimeoutElementState>();
    this._state = {};
  }
}
