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
      data: {
        type: 'gif',
        src: '',
        title: '',
        description: '',
      },
      attributes: {},
    };
  }

  set(value: VideoElementState) {
    this.state.data.type = value.type;
    this.state.data.src = value.src;
    this.state.data.title = value.title;
    this.state.data.description = value.description;
    this.state.attributes.visibility = 'visible';
    this.subject.next(this.state);
  }
}
