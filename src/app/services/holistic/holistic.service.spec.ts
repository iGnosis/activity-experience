import { TestBed } from '@angular/core/testing';

import { HolisticServiceOld } from './holistic.service';

describe('HolisticService', () => {
  let service: HolisticServiceOld;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(HolisticServiceOld);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
