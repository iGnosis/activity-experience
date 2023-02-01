import { Subject } from 'rxjs';
import { CalibrationService } from '../services/calibration/calibration.service';
import { ElementAttributes } from './pointmotion';

export class GameElement<T, M> {
  _state: { data: T; attributes: M & ElementAttributes };
  _subject: Subject<{ data: T; attributes: M & ElementAttributes }>;
  reCalibrationCount: number | undefined = -1;

  constructor(calibrationService: CalibrationService) {
    calibrationService.reCalibrationCount.subscribe((count: number) => {
      this.reCalibrationCount = count;
    });
  }

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
    // For the first call, we need to set the state first
    if (state.attributes.reCalibrationCount) {
      this.attributes.reCalibrationCount = state.attributes.reCalibrationCount;
    }
    if (!this.attributes.reCalibrationCount) {
      // alert('reCalibrationCount not set');
      console.error('reCalibrationCount not set');
      console.error(this._state.data);
      console.error(this._state.attributes);
      return;
    }
    let recalibrationTimeout;
    // Refactor: Avoid workaround to debounce recalibration
    if (this.reCalibrationCount !== this.attributes.reCalibrationCount) {
      recalibrationTimeout = setTimeout(() => {
        console.error('Global::reCalibrationCount', this.reCalibrationCount);
        console.error('Local::reCalibrationCount', this.attributes.reCalibrationCount);
        console.error(this._state.data);
        console.error(this._state.attributes);
        throw new Error('Recalibration count changed from elements');
      }, 2000);
    } else {
      clearTimeout(recalibrationTimeout);
    }
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
    if (!this.attributes.reCalibrationCount) {
      console.error('reCalibrationCount not set');
      console.error(this._state.data);
      console.error(this._state.attributes);
      throw new Error('reCalibrationCount not set');
      // return;
    }
    if (this.reCalibrationCount !== this.attributes.reCalibrationCount) {
      console.error('Global::reCalibrationCount', this.reCalibrationCount);
      console.error('Local::reCalibrationCount', this.attributes.reCalibrationCount);
      console.error(this._state.data);
      console.error(this._state.attributes);
      // throw new Error('Recalibration count changed');
    }
    this._state.data = { ...this._state.data, ...d };
    this._subject.next(this._state);
  }

  get subject() {
    return this._subject;
  }

  set subject(subject: Subject<{ data: T; attributes: M & ElementAttributes }>) {
    this._subject = subject;
  }
}
