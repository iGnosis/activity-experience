import { TestBed } from '@angular/core/testing';

import { MovingTonesScene } from './moving-tones.scene';

describe('MovingTonesService', () => {
  let service: MovingTonesScene;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(MovingTonesScene);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
