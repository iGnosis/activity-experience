import { TestBed } from '@angular/core/testing';

import { UnlockNotificationService } from './unlock-notification.service';

describe('UnlockNotificationService', () => {
  let service: UnlockNotificationService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(UnlockNotificationService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
