import { TestBed } from '@angular/core/testing';
import { provideMockStore } from '@ngrx/store/testing';

import { GameStateService } from './game-state.service';

describe('GameStateService', () => {
  let service: GameStateService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideMockStore({})],
    });
    service = TestBed.inject(GameStateService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
