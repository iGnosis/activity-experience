import { TestBed } from '@angular/core/testing';
import { Subject } from 'rxjs';

import { GuideService } from './guide.service';

describe('GuideService', () => {
  let service: GuideService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(GuideService);
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
        title: '',
        titleDuration: 2000,
      },
      attributes: {
        reCalibrationCount: -1,
      },
    });
  });
});
