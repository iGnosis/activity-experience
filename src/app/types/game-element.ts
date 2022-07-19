import { Subject } from 'rxjs';
import { ElementAttributes } from './pointmotion';

export class GameElement<T, M> {
  _state: { data: T; attributes: M & ElementAttributes };
  _subject: Subject<{ data: T; attributes: M & ElementAttributes }>;

  hide() {
    this._state.attributes.visibility = 'hidden';
  }

  show() {
    this._state.attributes.visibility = 'visible';
  }

  get state() {
    return this._state;
  }

  set state(state: { data: T; attributes: M & ElementAttributes }) {
    this._state = Object.assign(this._state, state);
    this._subject.next(this._state);
  }

  get attributes() {
    return this._state.attributes;
  }

  set attributes(attr) {
    this._state.attributes = attr;
    this._subject.next(this.state);
  }

  get data() {
    return this._state.data;
  }

  set data(d: T) {
    this._state.data = d;
    this._subject.next(this._state);
  }

  get subject() {
    return this._subject;
  }

  set subject(subject: Subject<{ data: T; attributes: M & ElementAttributes }>) {
    this._subject = subject;
  }
}
