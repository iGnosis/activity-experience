import { TestBed } from '@angular/core/testing';
import { Subject } from 'rxjs';

import { TimerService } from './timer.service';

describe('TimerService', () => {
  let service: TimerService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(TimerService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should setup initial subject', () => {
    expect(service._subject).toBeInstanceOf(Subject);
  });

  it('should setup initial state', () => {
    expect(JSON.stringify(service._state)).toEqual(
      JSON.stringify({
        data: {
          mode: 'start',
          duration: 0,
          onComplete: () => {},
        },
        attributes: {},
      }),
    );
  });
});
