import { TestBed } from '@angular/core/testing';

import { HandClassifierService } from './hand-classifier.service';

describe('HandClassifierService', () => {
  let service: HandClassifierService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(HandClassifierService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
