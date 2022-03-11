import { TestBed } from '@angular/core/testing';

import { UiHelperService } from './ui-helper.service';

describe('UiHelperService', () => {
  let service: UiHelperService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(UiHelperService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
