import { TestBed } from '@angular/core/testing';

import { GoalSelectionService } from './goal-selection.service';

describe('GoalSelectionService', () => {
  let service: GoalSelectionService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(GoalSelectionService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
