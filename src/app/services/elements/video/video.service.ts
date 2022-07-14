import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';
import { GameElement } from 'src/app/types/game-element';
import { VideoElementState } from 'src/app/types/pointmotion';

@Injectable({
  providedIn: 'root',
})
export class VideoService extends GameElement<VideoElementState> {
  constructor() {
    super();
    this._subject = new Subject<VideoElementState>();
    this._state = {};
  }
}
