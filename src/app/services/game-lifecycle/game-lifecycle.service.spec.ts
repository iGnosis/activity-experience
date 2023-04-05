import { TestBed } from '@angular/core/testing';

import { GameLifecycleService } from './game-lifecycle.service';

describe('GameLifecycleService', () => {
  let service: GameLifecycleService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(GameLifecycleService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
