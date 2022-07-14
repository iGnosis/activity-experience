import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';
import { GameElement } from 'src/app/types/game-element';
import { BannerElementState } from 'src/app/types/pointmotion';

@Injectable({
  providedIn: 'root',
})
export class BannerService extends GameElement<BannerElementState> {
  constructor() {
    super();
    this._subject = new Subject<BannerElementState>();
    this._state = {};
  }
}
