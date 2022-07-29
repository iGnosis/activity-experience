import { TestBed } from '@angular/core/testing';

import { SitToStandService } from './sit-to-stand.service';

describe('SitToStandService', () => {
  let service: SitToStandService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(SitToStandService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
