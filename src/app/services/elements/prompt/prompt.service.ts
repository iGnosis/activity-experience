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
    this._state = {
      show: false,
      position: 'center'
    };
  }

  show() {
    this._state.show = true;
  }

  hide() {
    this._state.show = false;
  }

  setValue(value: string) {
    this._state.value = value;
  }

  getValue() {
    return this._state.value;
  }

  setPosition(position: PromptPosition) {
    this._state.position = position;
  }

  getPosition(): PromptPosition {
    return this._state.position;
  }
}
