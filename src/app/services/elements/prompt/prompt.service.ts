import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';
import { GameElement } from 'src/app/types/game-element';
import { PromptElementState } from 'src/app/types/pointmotion';

@Injectable({
  providedIn: 'root',
})
export class PromptService extends GameElement<PromptElementState> {
  constructor() {
    super();
    this.subject = new Subject<PromptElementState>();
    this._state = {
      show: false,
    };
  }
}
