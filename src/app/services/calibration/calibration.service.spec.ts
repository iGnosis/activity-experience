import { TestBed } from '@angular/core/testing';

import { CalibrationService } from './calibration.service';

describe('CalibrationService', () => {
  let service: CalibrationService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(CalibrationService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
