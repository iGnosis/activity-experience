import { TestBed } from '@angular/core/testing';

import { SoundExplorerScene } from './sound-explorer.scene';

describe('SoundSlicerService', () => {
  let service: SoundExplorerScene;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(SoundExplorerScene);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
