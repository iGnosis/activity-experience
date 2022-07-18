import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';
import { GameElement } from 'src/app/types/game-element';
import { ElementAttributes, RibbonElementState } from 'src/app/types/pointmotion';

@Injectable({
  providedIn: 'root',
})
export class RibbonService extends GameElement<RibbonElementState, object> {
  constructor() {
    super();
    this._subject = new Subject<{ data: RibbonElementState; attributes: ElementAttributes }>();
    this._state = {
      data: {},
      attributes: {},
    };
  }
}
