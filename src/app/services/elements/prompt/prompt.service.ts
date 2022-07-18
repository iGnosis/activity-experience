import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';
import { GameElement } from 'src/app/types/game-element';
import { ElementAttributes, PromptElementState } from 'src/app/types/pointmotion';

@Injectable({
  providedIn: 'root',
})
export class PromptService extends GameElement<PromptElementState, object> {
  constructor() {
    super();
    this.subject = new Subject<{ data: PromptElementState; attributes: ElementAttributes }>();
    this._state = {
      data: {},
      attributes: {},
    };
  }

  setValue(value: string) {
    this.state.data.value = value;
    this.subject.next(this.state);
  }
}
