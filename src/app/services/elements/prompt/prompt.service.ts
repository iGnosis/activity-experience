import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';
import { GameElement } from 'src/app/types/game-element';
import { PromptElementState, PromptPosition } from 'src/app/types/pointmotion';

@Injectable({
  providedIn: 'root',
})
export class PromptService extends GameElement<PromptElementState> {
  constructor() {
    super();
    this.subject = new Subject<PromptElementState>();
    this._state = {};
  }

  setValue(value: string) {
    this.state.value = value;
    this.subject.next(this.state);
  }

  setPosition(position: PromptPosition) {
    this._state.position = position;
    this.subject.next(this.state);
  }
}
