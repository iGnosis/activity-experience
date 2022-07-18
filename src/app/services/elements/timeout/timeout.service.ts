import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';
import { GameElement } from 'src/app/types/game-element';
import { ElementAttributes, TimeoutElementState } from 'src/app/types/pointmotion';

@Injectable({
  providedIn: 'root',
})
export class TimeoutService extends GameElement<TimeoutElementState, object> {
  constructor() {
    super();
    this._subject = new Subject<{ data: TimeoutElementState; attributes: ElementAttributes }>();
    this._state = {
      data: {},
      attributes: {},
    };
  }
}
