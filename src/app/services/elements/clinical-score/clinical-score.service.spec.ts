import { TestBed } from '@angular/core/testing';

import { ClinicalScoreService } from './clinical-score.service';

describe('ClinicalScoreService', () => {
  let service: ClinicalScoreService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ClinicalScoreService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
