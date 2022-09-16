import { TestBed, waitForAsync } from '@angular/core/testing';
import { Store } from '@ngrx/store';
import { MockStore, provideMockStore } from '@ngrx/store/testing';
import { PreferenceState } from 'src/app/types/pointmotion';
import { GqlClientService } from '../gql-client/gql-client.service';

import { CheckinService } from './checkin.service';
import { of } from 'rxjs';

interface InititalState {
  genre?: string;
  mood?: string;
}

describe('CheckinService', () => {
  let service: CheckinService;
  let store: MockStore<InititalState>;

  const checkinServiceStub = {
    getUserGenre: async () => 'rock',
    getOnboardingStatus: async () => [
      { beat_boxer: false, sound_explorer: true, sit_stand_achieve: true },
    ],
    updateOnboardingStatus: async () => ({
      beat_boxer: false,
      sound_explorer: false,
      sit_stand_achieve: true,
    }),
    getHighScore: async () => [
      {
        id: 'a7c78ccd-5efe-43ed-970c-78985e42672d',
        repsCompleted: 73,
      },
    ],
    getFastestTime: async () => 0,
    getLastGame: async () => [],
  };

  const initialState = {
    genre: undefined,
    mood: undefined,
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        { provide: CheckinService, useValue: checkinServiceStub },
        provideMockStore({
          initialState,
        }),
      ],
    });
    service = TestBed.inject(CheckinService);
    store = TestBed.inject(MockStore);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  // it('should get time for given seconds', () => {
  //   expect(service.getDurationForTimer(1000)).toEqual({ minutes: '16', seconds: '40' });
  // });

  it('should get user genre', waitForAsync(() => {
    service.getUserGenre().then((genre) => {
      expect(genre).toEqual('rock');
    });
  }));

  it('should get onboarding status', waitForAsync(() => {
    service.getOnboardingStatus().then((status) => {
      expect(status[0]).toEqual({
        beat_boxer: false,
        sound_explorer: true,
        sit_stand_achieve: true,
      });
    });
  }));

  it('should update onboarding status', waitForAsync(() => {
    service.updateOnboardingStatus({ beat_boxer: false }).then((status) => {
      expect(status).toEqual({
        beat_boxer: false,
        sound_explorer: false,
        sit_stand_achieve: true,
      });
    });
  }));

  it('should get high score', waitForAsync(() => {
    service.getHighScore('beat_boxer').then((score) => {
      expect(score[0]).toEqual({
        id: 'a7c78ccd-5efe-43ed-970c-78985e42672d',
        repsCompleted: 73,
      });
    });
  }));

  it('should get fastest time', waitForAsync(() => {
    service.getFastestTime('sit_stand_achieve').then((time) => {
      expect(time).toEqual(0);
    });
  }));

  it('should get last game', waitForAsync(() => {
    service.getLastGame().then((game) => {
      expect(game).toEqual([]);
    });
  }));
});
