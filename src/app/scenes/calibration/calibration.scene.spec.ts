import { TestBed } from '@angular/core/testing';

import { CalibrationScene } from './calibration.scene';

describe('CalibrationService', () => {
  let service: CalibrationScene;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(CalibrationScene);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
