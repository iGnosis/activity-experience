import { TestBed } from '@angular/core/testing';
import { provideMockStore } from '@ngrx/store/testing';

import { BeatBoxerService } from './beat-boxer.service';

describe('BeatBoxerService', () => {
  let service: BeatBoxerService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideMockStore({})],
    });
    service = TestBed.inject(BeatBoxerService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
