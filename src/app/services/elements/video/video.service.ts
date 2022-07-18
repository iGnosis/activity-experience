import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';
import { GameElement } from 'src/app/types/game-element';
import { ElementAttributes, VideoElementState } from 'src/app/types/pointmotion';

@Injectable({
  providedIn: 'root',
})
export class VideoService extends GameElement<VideoElementState, object> {
  constructor() {
    super();
    this._subject = new Subject<{ data: VideoElementState; attributes: ElementAttributes }>();
    this._state = {
      data: {},
      attributes: {},
    };
  }
}
