import { TestBed } from '@angular/core/testing';

import { SoundExplorerService } from './sound-explorer.service';

describe('SoundExplorerService', () => {
  let service: SoundExplorerService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(SoundExplorerService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
