import { TestBed } from '@angular/core/testing';

import { HolisticService } from './holistic.service';

describe('HolisticService', () => {
  let service: HolisticService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(HolisticService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
