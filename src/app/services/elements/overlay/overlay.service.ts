import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';
import { GameElement } from 'src/app/types/game-element';
import { OverlayElementState } from 'src/app/types/pointmotion';

@Injectable({
  providedIn: 'root',
})
export class OverlayService extends GameElement<OverlayElementState> {
  constructor() {
    super();
    this._subject = new Subject<OverlayElementState>();
    this._state = {};
  }
}
