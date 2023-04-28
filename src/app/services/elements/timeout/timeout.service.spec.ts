import { TestBed } from '@angular/core/testing';
import { Subject } from 'rxjs';

import { TimeoutService } from './timeout.service';

describe('TimeoutService', () => {
  let service: TimeoutService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(TimeoutService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should setup initial subject', () => {
    expect(service._subject).toBeInstanceOf(Subject);
  });

  it('should setup initial state', () => {
    expect(service._state).toEqual({
      data: {
        mode: 'start',
        isGradient: false,
      },
      attributes: {},
    });
  });
});
