import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';
import { GameElement } from 'src/app/types/game-element';
import { RibbonElementState } from 'src/app/types/pointmotion';

@Injectable({
  providedIn: 'root',
})
export class RibbonService extends GameElement<RibbonElementState> {
  constructor() {
    super();
    this._subject = new Subject<RibbonElementState>();
    this._state = {
      titles: ['camera setup complete'],
    };
  }
}
