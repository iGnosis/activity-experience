import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';
import { GameElement } from 'src/app/types/game-element';
import { ElementAttributes, OverlayElementState } from 'src/app/types/pointmotion';

@Injectable({
  providedIn: 'root',
})
export class OverlayService extends GameElement<OverlayElementState, object> {
  constructor() {
    super();
    this._subject = new Subject<{ data: OverlayElementState; attributes: ElementAttributes }>();
    this._state = {
      data: {},
      attributes: {},
    };
  }
}
