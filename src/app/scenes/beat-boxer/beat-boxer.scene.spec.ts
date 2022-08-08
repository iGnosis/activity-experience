import { TestBed } from '@angular/core/testing';

import { BeatBoxerScene } from './beat-boxer.scene';

describe('BeatBoxerService', () => {
  let service: BeatBoxerScene;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(BeatBoxerScene);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
