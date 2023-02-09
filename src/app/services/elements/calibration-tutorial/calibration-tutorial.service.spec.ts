import { TestBed } from '@angular/core/testing';

import { CalibrationTutorialService } from './calibration-tutorial.service';

describe('CalibrationTutorialService', () => {
  let service: CalibrationTutorialService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(CalibrationTutorialService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
