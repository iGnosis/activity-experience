import { TestBed } from '@angular/core/testing';
import { Subject } from 'rxjs';

import { ScoreService } from './score.service';

describe('RepsService', () => {
  let service: ScoreService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ScoreService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should setup initial subject', () => {
    expect(service._subject).toBeInstanceOf(Subject);
  });

  it('should setup initial state', () => {
    expect(service._state).toEqual({
      data: {
        score: 0,
        icon: '/assets/images/xp-coin.png',
        position: {
          top: '50%',
          left: '75%',
        },
        showScoreGained: true,
      },
      attributes: {},
    });
  });
});
