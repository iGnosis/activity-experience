import { TestBed } from '@angular/core/testing';

import { MovingTonesService } from './moving-tones.service';

describe('MovingTonesService', () => {
  let service: MovingTonesService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(MovingTonesService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
