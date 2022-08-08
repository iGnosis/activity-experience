import { TestBed } from '@angular/core/testing';

import { HandTrackerService } from './hand-tracker.service';

describe('HandRaisedService', () => {
  let service: HandTrackerService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(HandTrackerService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
