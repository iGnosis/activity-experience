import { TestBed } from '@angular/core/testing';
import { Subject } from 'rxjs';

import { ConfettiService } from './confetti.service';

describe('ConfettiService', () => {
  let service: ConfettiService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ConfettiService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should setup initial subject', () => {
    expect(service._subject).toBeInstanceOf(Subject);
  });

  it('should setup initial state', () => {
    expect(service._state).toEqual({
      data: {},
      attributes: {},
    });
  });
});
