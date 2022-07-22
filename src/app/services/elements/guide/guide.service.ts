import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';
import { GameElement } from 'src/app/types/game-element';
import { GuideElementState, ElementAttributes } from 'src/app/types/pointmotion';

@Injectable({
  providedIn: 'root',
})
export class GuideService extends GameElement<GuideElementState, object> {
  constructor() {
    super();
    this._subject = new Subject<{ data: GuideElementState; attributes: ElementAttributes }>();
    this._state = {
      data: {
        title: '',
        titleDuration: 2000,
      },
      attributes: {},
    };
  }
}
