import { TestBed } from '@angular/core/testing';

import { BadgePopupService } from './badge-popup.service';

describe('BadgePopupService', () => {
  let service: BadgePopupService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(BadgePopupService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
